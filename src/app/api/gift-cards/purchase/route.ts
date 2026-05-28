import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import SiteSettings from "@/models/SiteSettings";
import GiftCard from "@/models/GiftCard";
import Order from "@/models/Order";
import {
  createGiftCard,
  sendGiftCardEmails,
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
} from "@/lib/giftcard";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(), // euros
  purchaser: z.object({
    name: z.string().min(1, "Le nom de l'acheteur est requis"),
    email: z.string().email("Email acheteur invalide"),
  }),
  recipient: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Email destinataire invalide").optional(),
      message: z.string().max(500).optional(),
    })
    .optional(),
  stripePaymentIntentId: z.string().regex(/^pi_/, "PaymentIntent invalide"),
});

// POST /api/gift-cards/purchase — création de la carte après paiement Stripe confirmé
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
    const data = schema.parse(body);
    const cents = Math.round(data.amount * 100);

    if (cents < GIFT_CARD_MIN_AMOUNT || cents > GIFT_CARD_MAX_AMOUNT) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const { stripePaymentIntentId } = data;

    // Dédoublonnage : un PI ne peut servir qu'une fois (commande OU carte cadeau)
    const [existingCard, existingOrder] = await Promise.all([
      GiftCard.exists({ stripePaymentIntentId }),
      Order.exists({ paymentId: stripePaymentIntentId }),
    ]);
    if (existingCard || existingOrder) {
      return NextResponse.json(
        { error: "Ce paiement a déjà été utilisé" },
        { status: 400 }
      );
    }

    // Vérification côté Stripe : ne jamais faire confiance au frontend pour
    // confirmer qu'un paiement a réellement eu lieu.
    const stripe = await getStripe();
    const pi = await stripe.paymentIntents.retrieve(stripePaymentIntentId, {
      expand: ["latest_charge"],
    });

    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: `Le paiement n'a pas été confirmé (statut : ${pi.status})` },
        { status: 400 }
      );
    }
    if (pi.amount !== cents) {
      return NextResponse.json(
        { error: "Montant du paiement incorrect" },
        { status: 400 }
      );
    }

    const session = await auth();
    const charge = pi.latest_charge as { receipt_url?: string } | null;

    const giftCard = await createGiftCard({
      initialAmount: cents,
      source: "online",
      stripePaymentIntentId,
      stripeReceiptUrl: charge?.receipt_url || undefined,
      purchasedBy: {
        userId: session?.user?.id,
        name: data.purchaser.name,
        email: data.purchaser.email,
      },
      recipient: data.recipient
        ? {
            name: data.recipient.name,
            email: data.recipient.email,
            message: data.recipient.message,
          }
        : {},
    });

    // Emails best-effort (ne bloquent pas la réponse)
    sendGiftCardEmails(giftCard).catch((err) =>
      console.error("sendGiftCardEmails failed:", err)
    );

    return NextResponse.json(
      {
        id: giftCard._id,
        code: giftCard.code,
        amount: giftCard.initialAmount,
        recipient: giftCard.recipient,
        expiresAt: giftCard.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/gift-cards/purchase error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
