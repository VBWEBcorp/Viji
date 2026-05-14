import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Order from "@/models/Order";

// GET /api/orders — Liste (admin ou user)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status_filter = searchParams.get("status") || "";
    const scope = searchParams.get("scope");

    const filter: Record<string, unknown> = {};

    // scope=user : force le filtrage par user (utilisé par /account, même si
    // l'utilisateur est admin — un admin qui visite son espace client ne doit
    // voir QUE ses propres commandes, pas toutes celles de la base).
    if (scope === "user" || session.user.role !== "admin") {
      filter.user = session.user.id;
    }

    if (status_filter) {
      filter.paymentStatus = status_filter;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
