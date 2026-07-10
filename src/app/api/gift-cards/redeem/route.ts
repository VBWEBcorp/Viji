import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GiftCardError, redeemOnSite } from "@/lib/giftcard";

// POST /api/gift-cards/redeem — utilisation sur place (staff/admin).
// Carte à usage unique : la carte est consommée en totalité.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json(
        { error: "Le code de la carte est requis" },
        { status: 400 }
      );
    }

    const giftCard = await redeemOnSite(
      code,
      {
        id: session.user.id,
        name: session.user.name || session.user.email || "Admin",
      },
      typeof body.description === "string" ? body.description : null
    );

    return NextResponse.json({
      code: giftCard.code,
      amount: giftCard.initialAmount,
      status: giftCard.status,
    });
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/gift-cards/redeem error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
