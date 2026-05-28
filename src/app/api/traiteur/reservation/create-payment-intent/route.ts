import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { computeTraiteurAmount } from "@/lib/traiteur";

// Montant minimum facturable par Stripe (50 centimes pour l'EUR).
const STRIPE_MIN_CHARGE = 50;

const schema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Sélectionnez au moins un plat"),
});

// POST /api/traiteur/reservation/create-payment-intent
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { items } = schema.parse(body);

    const computed = await computeTraiteurAmount(items);
    if (!computed) {
      return NextResponse.json(
        { error: "Un plat sélectionné n'est plus disponible. Actualisez la page." },
        { status: 400 }
      );
    }
    if (computed.amount < STRIPE_MIN_CHARGE) {
      return NextResponse.json(
        { error: "Montant trop faible pour un paiement en ligne" },
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: computed.amount,
      currency: "eur",
      metadata: { kind: "traiteur" },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: computed.amount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/traiteur/reservation/create-payment-intent error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
