import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import SiteSettings from "@/models/SiteSettings";
import {
  GiftCardError,
  MIN_AMOUNT,
  MAX_AMOUNT,
  purchaseGiftCard,
} from "@/lib/giftcard";
import { isStripeConfigured } from "@/lib/stripe";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/gift-cards/purchase — achat en ligne (public).
// Crée la carte après vérification du paiement Stripe (ou mode test).
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

    const body = await req.json();
    const amount = Number(body.amount); // euros
    const purchaser = body.purchaser || {};
    const recipient = body.recipient || {};
    const stripePaymentIntentId = body.stripePaymentIntentId;

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
    if (
      typeof stripePaymentIntentId !== "string" ||
      !stripePaymentIntentId.startsWith("pi_")
    ) {
      return NextResponse.json(
        { error: "Identifiant de paiement manquant ou invalide" },
        { status: 400 }
      );
    }

    // Si un acheteur est connecté, on lie la carte à son compte.
    const session = await auth();

    const giftCard = await purchaseGiftCard(
      {
        amount,
        purchaser: {
          name: purchaser.name,
          email: purchaser.email,
          userId: session?.user?.id || null,
        },
        recipient: {
          name: recipient.name || undefined,
          email: recipient.email || undefined,
          message: recipient.message || undefined,
        },
      },
      stripePaymentIntentId
    );

    return NextResponse.json(
      {
        id: giftCard._id,
        code: giftCard.code,
        amount: giftCard.initialAmount,
        recipient: giftCard.recipient,
        expiresAt: giftCard.expiresAt,
        testMode: !(await isStripeConfigured()),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/gift-cards/purchase error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
