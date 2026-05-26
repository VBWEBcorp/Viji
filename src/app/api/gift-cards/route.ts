import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import GiftCard from "@/models/GiftCard";
import {
  createGiftCard,
  sendGiftCardEmails,
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
} from "@/lib/giftcard";
import { z } from "zod";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/gift-cards — liste paginée (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();

    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const limit = Math.min(100, parseInt(sp.get("limit") || "20", 10));
    const status = sp.get("status") || "";
    const search = sp.get("search") || "";

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [
        { code: rx },
        { "purchasedBy.email": rx },
        { "recipient.email": rx },
        { "recipient.name": rx },
      ];
    }

    const [giftCards, total] = await Promise.all([
      GiftCard.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GiftCard.countDocuments(query),
    ]);

    return NextResponse.json({
      giftCards,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/gift-cards error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

const createSchema = z.object({
  amount: z.number().positive(), // euros
  recipient: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Email destinataire invalide").optional(),
      message: z.string().max(500).optional(),
    })
    .optional(),
  purchaser: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Email acheteur invalide").optional(),
    })
    .optional(),
});

// POST /api/gift-cards — création manuelle (admin, sans paiement Stripe)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const data = createSchema.parse(body);
    const cents = Math.round(data.amount * 100);

    if (cents < GIFT_CARD_MIN_AMOUNT || cents > GIFT_CARD_MAX_AMOUNT) {
      return NextResponse.json(
        {
          error: `Le montant doit être entre ${GIFT_CARD_MIN_AMOUNT / 100} € et ${GIFT_CARD_MAX_AMOUNT / 100} €`,
        },
        { status: 400 }
      );
    }

    const giftCard = await createGiftCard(
      {
        initialAmount: cents,
        source: "admin",
        purchasedBy: data.purchaser,
        recipient: data.recipient || {},
      },
      session.user.id
    );

    // Si un email destinataire est fourni, on envoie tout de suite la carte.
    if (giftCard.recipient?.email || giftCard.purchasedBy?.email) {
      sendGiftCardEmails(giftCard).catch((err) =>
        console.error("sendGiftCardEmails (admin) failed:", err)
      );
    }

    return NextResponse.json(giftCard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST /api/gift-cards error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
