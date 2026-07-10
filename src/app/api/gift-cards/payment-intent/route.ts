import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { MIN_AMOUNT, MAX_AMOUNT } from "@/lib/giftcard";
import { isStripeConfigured, createGiftCardPaymentIntent } from "@/lib/stripe";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/gift-cards/payment-intent — initialise un paiement Stripe (public).
// Renvoie le client_secret consommé par Stripe Elements côté front.
//
// L'acheteur et le destinataire sont embarqués dans les metadata du
// PaymentIntent : ainsi le webhook `payment_intent.succeeded` peut recréer la
// carte même si le navigateur disparaît après le paiement.
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const settings = await SiteSettings.findOne().select("giftCards").lean();
    if (!settings?.giftCards?.enabled) {
      return NextResponse.json(
        { error: "Les cartes cadeaux ne sont pas disponibles" },
        { status: 400 }
      );
    }

    if (!(await isStripeConfigured())) {
      return NextResponse.json(
        { error: "Le paiement en ligne n'est pas encore activé." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const amount = Number(body.amount); // euros
    const purchaser = body.purchaser || {};
    const recipient = body.recipient || {};

    if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Le montant doit être entre ${MIN_AMOUNT}€ et ${MAX_AMOUNT}€` },
        { status: 400 }
      );
    }
    if (!purchaser.name || !purchaser.email || !emailRe.test(purchaser.email)) {
      return NextResponse.json(
        { error: "Le nom et un email valide de l'acheteur sont requis" },
        { status: 400 }
      );
    }
    if (recipient.email && !emailRe.test(recipient.email)) {
      return NextResponse.json(
        { error: "Email du destinataire invalide" },
        { status: 400 }
      );
    }

    // Metadata Stripe : uniquement des chaînes, on n'inclut que les champs remplis.
    const metadata: Record<string, string> = {
      kind: "gift_card",
      amount_euros: String(amount),
      purchaser_name: String(purchaser.name).slice(0, 200),
      purchaser_email: String(purchaser.email).slice(0, 200),
    };
    if (recipient.name)
      metadata.recipient_name = String(recipient.name).slice(0, 200);
    if (recipient.email)
      metadata.recipient_email = String(recipient.email).slice(0, 200);
    if (recipient.message)
      metadata.recipient_message = String(recipient.message).slice(0, 200);

    const { clientSecret, paymentIntentId } = await createGiftCardPaymentIntent(
      amount,
      metadata
    );

    return NextResponse.json({ clientSecret, paymentIntentId });
  } catch (error) {
    console.error("POST /api/gift-cards/payment-intent error:", error);
    return NextResponse.json(
      { error: "Impossible d'initialiser le paiement." },
      { status: 500 }
    );
  }
}
