import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { resolveAtelierUnitPrice } from "@/lib/ateliers";

// Montant minimum facturable par Stripe (50 centimes pour l'EUR).
const STRIPE_MIN_CHARGE = 50;

const schema = z.object({
  sessionSlug: z.string().min(1),
  participants: z.coerce.number().int().min(1).max(20),
});

// POST /api/ateliers/reservation/create-payment-intent
// Crée l'intention de paiement pour la réservation d'un atelier.
// Le montant est TOUJOURS recalculé côté serveur (prix de la session × nombre
// de participants) : on ne fait jamais confiance à un montant envoyé par le client.
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { sessionSlug, participants } = schema.parse(body);

    const unitPrice = await resolveAtelierUnitPrice(sessionSlug);
    if (unitPrice === null) {
      return NextResponse.json(
        { error: "Atelier introuvable ou indisponible" },
        { status: 404 }
      );
    }

    const amount = unitPrice * participants;
    if (amount < STRIPE_MIN_CHARGE) {
      return NextResponse.json(
        { error: "Montant trop faible pour un paiement en ligne" },
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      metadata: {
        kind: "atelier",
        sessionSlug,
        participants: String(participants),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/ateliers/reservation/create-payment-intent error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
