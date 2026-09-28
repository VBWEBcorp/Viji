import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getStripe, assertStripeLiveInProduction } from "@/lib/stripe";
import { resolveAtelierUnitPrice } from "@/lib/ateliers";
import { getEtatCanal, messageCanalFerme } from "@/lib/disponibilite";
import { resoutPromo } from "@/lib/promo";

// Montant minimum facturable par Stripe (50 centimes pour l'EUR).
const STRIPE_MIN_CHARGE = 50;

const schema = z.object({
  sessionSlug: z.string().min(1),
  participants: z.coerce.number().int().min(1).max(20),
  /** Code promo saisi par le client (optionnel), revérifié ici. */
  promoCode: z.string().trim().max(40).optional(),
});

// POST /api/ateliers/reservation/create-payment-intent
// Crée l'intention de paiement pour la réservation d'un atelier.
// Le montant est TOUJOURS recalculé côté serveur (prix de la session × nombre
// de participants) : on ne fait jamais confiance à un montant envoyé par le client.
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Le vrai verrou d'une fermeture : on refuse AVANT d'encaisser. Une page
    // laissée ouverte pendant la mise en pause ne doit pas pouvoir payer.
    const etat = await getEtatCanal("ateliers");
    if (!etat.ouvert) {
      return NextResponse.json(
        { error: messageCanalFerme(etat) },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { sessionSlug, participants, promoCode } = schema.parse(body);

    const unitPrice = await resolveAtelierUnitPrice(sessionSlug);
    if (unitPrice === null) {
      return NextResponse.json(
        { error: "Atelier introuvable ou indisponible" },
        { status: 404 }
      );
    }

    const subtotal = unitPrice * participants;

    // Code promo : remise calculée ici et gravée dans le paiement (voir le
    // traiteur à emporter, même principe).
    let discount = 0;
    let appliedCode = "";
    if (promoCode) {
      const promo = await resoutPromo(promoCode, subtotal);
      if (!promo.ok) {
        return NextResponse.json({ error: promo.error }, { status: 400 });
      }
      discount = promo.discount;
      appliedCode = promo.promo.code;
    }
    const amount = subtotal - discount;

    if (amount < STRIPE_MIN_CHARGE) {
      return NextResponse.json(
        { error: "Montant trop faible pour un paiement en ligne" },
        { status: 400 }
      );
    }

    // Garde-fou : jamais de paiement en mode test en production.
    const modeError = await assertStripeLiveInProduction();
    if (modeError) {
      return NextResponse.json({ error: modeError }, { status: 503 });
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      metadata: {
        kind: "atelier",
        sessionSlug,
        participants: String(participants),
        ...(appliedCode
          ? { promoCode: appliedCode, promoDiscount: String(discount) }
          : {}),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      discount,
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
