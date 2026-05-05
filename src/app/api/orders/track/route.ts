import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";

// GET /api/orders/track?orderNumber=xxx&email=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    const email = searchParams.get("email");

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    await connectDB();

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
      user: user._id,
    })
      .select("orderNumber paymentStatus fulfillmentStatus total items tracking createdAt")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      tracking: order.tracking,
      createdAt: order.createdAt,
    });
  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
