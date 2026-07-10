import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  GiftCardError,
  MIN_AMOUNT,
  MAX_AMOUNT,
  createGiftCard,
  getAllGiftCards,
} from "@/lib/giftcard";
import type { GiftCardSource } from "@/models/GiftCard";

// GET /api/gift-cards — liste paginée (admin)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const result = await getAllGiftCards(
      {
        status: sp.get("status") || undefined,
        search: sp.get("search") || undefined,
      },
      { page: sp.get("page") || undefined, limit: sp.get("limit") || undefined }
    );

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("GET /api/gift-cards error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/gift-cards — création manuelle (admin, sans paiement Stripe)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.initialAmount ?? body.amount);
    if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Le montant doit être entre ${MIN_AMOUNT}€ et ${MAX_AMOUNT}€` },
        { status: 400 }
      );
    }

    const allowedSources: GiftCardSource[] = [
      "on_site",
      "avoir",
      "employee_benefit",
    ];
    const source: GiftCardSource = allowedSources.includes(body.source)
      ? body.source
      : "admin";

    const giftCard = await createGiftCard(
      {
        initialAmount: amount,
        source,
        purchasedBy: body.purchasedBy || {},
        recipient: body.recipient || {},
        imageUrl:
          typeof body.imageUrl === "string" && body.imageUrl
            ? body.imageUrl
            : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        adminName: session.user.name || session.user.email || null,
      },
      session.user.id
    );

    return NextResponse.json(giftCard, { status: 201 });
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/gift-cards error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
