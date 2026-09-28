import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resoutPromo } from "@/lib/promo";
import { z } from "zod";

const schema = z.object({
  code: z.string().trim().min(1, "Code requis"),
  subtotal: z.number().min(0), // sous-total en centimes
});

// POST /api/promos/validate — vérifie un code promo et renvoie la remise (public).
// Sert à afficher la remise avant paiement, sur la boutique, le traiteur à
// emporter et les ateliers. L'application qui fait foi reste côté serveur, au
// moment de créer le paiement.
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { code, subtotal } = schema.parse(body);

    const res = await resoutPromo(code, subtotal);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      code: res.promo.code,
      type: res.promo.type,
      value: res.promo.value,
      discount: res.discount,
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
