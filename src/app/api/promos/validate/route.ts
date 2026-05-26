import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PromoCode from "@/models/PromoCode";
import { z } from "zod";

const schema = z.object({
  code: z.string().trim().min(1, "Code requis"),
  subtotal: z.number().min(0), // sous-total panier en centimes
});

// POST /api/promos/validate — vérifie un code promo et renvoie la remise (public).
// La validation/application autoritaire reste faite dans /api/checkout ; cet
// endpoint sert uniquement à afficher la remise avant paiement.
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, subtotal } = schema.parse(body);

    const now = new Date();
    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    });

    if (!promo) {
      return NextResponse.json(
        { error: "Code promo invalide ou expiré" },
        { status: 404 }
      );
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json(
        { error: "Ce code promo a atteint son nombre maximum d'utilisations" },
        { status: 400 }
      );
    }

    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Montant minimum de commande non atteint pour ce code`,
        },
        { status: 400 }
      );
    }

    // Mêmes règles que /api/checkout : pourcentage sinon montant fixe (centimes).
    let discount =
      promo.type === "percentage"
        ? Math.round(subtotal * (promo.value / 100))
        : promo.value;
    discount = Math.min(discount, subtotal); // jamais plus que le sous-total

    return NextResponse.json({
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/promos/validate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
