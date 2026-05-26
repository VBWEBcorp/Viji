import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import GiftCard from "@/models/GiftCard";
import { cancelGiftCard, GiftCardError } from "@/lib/giftcard";

// GET /api/gift-cards/[id] — détail (admin)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const giftCard = await GiftCard.findById(id).lean();

    if (!giftCard) {
      return NextResponse.json(
        { error: "Carte cadeau introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(giftCard);
  } catch (error) {
    console.error("GET /api/gift-cards/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/gift-cards/[id] — annulation (admin). { action: "cancel" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    const giftCard = await cancelGiftCard(id, {
      id: session.user.id,
      name: session.user.name || session.user.email || undefined,
    });

    return NextResponse.json(giftCard);
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("PATCH /api/gift-cards/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
