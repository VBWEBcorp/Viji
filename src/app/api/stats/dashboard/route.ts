import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let prevStartDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "12m":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        prevStartDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      // Current period stats
      currentRevenue,
      currentOrderCount,
      // Previous period stats (for comparison)
      prevRevenue,
      prevOrderCount,
      // Recent orders
      recentOrders,
      // Revenue over time (daily aggregation)
      revenueOverTime,
      // Top products
      topProducts,
      // Orders by status
      ordersByStatus,
      // New customers in period
      newCustomers,
      prevNewCustomers,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      // Current period revenue
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      // Previous period revenue
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: prevStartDate, $lt: startDate } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),
      // Recent orders
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber total paymentStatus fulfillmentStatus createdAt")
        .populate("user", "name")
        .lean(),
      // Revenue over time - daily
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Top products by revenue
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            revenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      // Orders by status
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ]),
      // New customers
      User.countDocuments({ role: "customer", createdAt: { $gte: startDate } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: prevStartDate, $lt: startDate } }),
    ]);

    const currentRev = currentRevenue[0]?.total || 0;
    const prevRev = prevRevenue[0]?.total || 0;
    const currentCount = currentRevenue[0]?.count || 0;
    const aov = currentCount > 0 ? Math.round(currentRev / currentCount) : 0;

    // Fill in missing days for the chart
    const chartData: { date: string; revenue: number; orders: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const revenueMap = new Map(revenueOverTime.map((r: { _id: string; revenue: number; orders: number }) => [r._id, r]));

    for (let d = new Date(startDate); d <= now; d = new Date(d.getTime() + dayMs)) {
      const key = d.toISOString().split("T")[0];
      const entry = revenueMap.get(key) as { revenue: number; orders: number } | undefined;
      chartData.push({
        date: key,
        revenue: entry?.revenue || 0,
        orders: entry?.orders || 0,
      });
    }

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: currentRev,
      previousRevenue: prevRev,
      revenueChange: prevRev > 0 ? Math.round(((currentRev - prevRev) / prevRev) * 100) : 0,
      orderCount: currentOrderCount,
      previousOrderCount: prevOrderCount,
      newCustomers,
      previousNewCustomers: prevNewCustomers,
      aov,
      recentOrders,
      chartData,
      topProducts,
      ordersByStatus: ordersByStatus.reduce((acc: Record<string, number>, s: { _id: string; count: number }) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("GET /api/stats/dashboard error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
