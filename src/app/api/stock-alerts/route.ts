import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import StockAlert from "@/models/StockAlert";

// POST /api/stock-alerts — Subscribe to back-in-stock
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, productId, variant } = await req.json();

    if (!email || !productId) {
      return NextResponse.json({ error: "Email et produit requis" }, { status: 400 });
    }

    await StockAlert.findOneAndUpdate(
      { email: email.toLowerCase(), product: productId },
      { email: email.toLowerCase(), product: productId, variant, notified: false },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Vous serez prevenu quand le produit sera disponible" });
  } catch (error) {
    console.error("POST /api/stock-alerts error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
