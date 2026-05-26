import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import SiteSettings from "@/models/SiteSettings";
import {
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
} from "@/lib/giftcard";
import { z } from "zod";

const schema = z.object({
  // Montant en euros (saisi côté client), converti en centimes côté serveur.
  amount: z.number().positive(),
  email: z.string().email().optional(),
});

// POST /api/gift-cards/create-payment-intent
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
    const { amount, email } = schema.parse(body);
    const cents = Math.round(amount * 100);

    if (cents < GIFT_CARD_MIN_AMOUNT || cents > GIFT_CARD_MAX_AMOUNT) {
      return NextResponse.json(
        {
          error: `Le montant doit être entre ${GIFT_CARD_MIN_AMOUNT / 100} € et ${GIFT_CARD_MAX_AMOUNT / 100} €`,
        },
        { status: 400 }
      );
    }

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents,
      currency: "eur",
      ...(email ? { receipt_email: email } : {}),
      metadata: { kind: "gift_card", amount: String(cents) },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/gift-cards/create-payment-intent error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
