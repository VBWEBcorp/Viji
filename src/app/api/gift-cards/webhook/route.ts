import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { GiftCardError, purchaseGiftCard } from "@/lib/giftcard";
import { constructWebhookEvent, isGiftCardWebhookConfigured } from "@/lib/stripe";

// POST /api/gift-cards/webhook — filet de sécurité côté serveur.
//
// Stripe appelle cette route en direct (server-to-server) à chaque paiement
// confirmé. On y (re)crée la carte cadeau : même si le navigateur du client a
// disparu après le paiement, la carte est garantie. L'index unique +
// l'idempotence de purchaseGiftCard évitent tout doublon avec le flux front.
//
// Important : on lit le corps BRUT (request.text()) car la vérification de
// signature Stripe l'exige.
export async function POST(request: NextRequest) {
  if (!(await isGiftCardWebhookConfigured())) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(rawBody, signature);
  } catch (err) {
    console.error("[webhook] signature invalide:", (err as Error).message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // On n'agit que sur nos propres paiements de carte cadeau.
    if (pi.metadata?.kind === "gift_card") {
      const md = pi.metadata;
      try {
        const card = await purchaseGiftCard(
          {
            amount: Number(md.amount_euros),
            purchaser: { name: md.purchaser_name, email: md.purchaser_email },
            recipient: {
              name: md.recipient_name || undefined,
              email: md.recipient_email || undefined,
              message: md.recipient_message || undefined,
            },
          },
          pi.id
        );
        console.log(`[webhook] carte garantie pour ${pi.id} -> ${card.code}`);
      } catch (err) {
        // GiftCardError = problème permanent (données invalides) : inutile que
        // Stripe rejoue, on accuse réception (200) en journalisant.
        if (err instanceof GiftCardError) {
          console.error(
            `[webhook] carte non créée pour ${pi.id}: ${err.message}`
          );
        } else {
          // Erreur potentiellement transitoire (DB indisponible…) : on renvoie
          // 500 pour que Stripe réessaie automatiquement.
          console.error(
            `[webhook] erreur transitoire pour ${pi.id}:`,
            (err as Error).message
          );
          return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
        }
      }
    }
  }

  // Accusé de réception : tout autre événement est simplement ignoré.
  return NextResponse.json({ received: true });
}
