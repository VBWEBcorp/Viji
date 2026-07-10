import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { GiftCardError, reactivateGiftCard } from "@/lib/giftcard";

// PATCH /api/gift-cards/[id]/reactivate — réactivation d'une carte annulée (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const giftCard = await reactivateGiftCard(id, {
      id: session.user.id,
      name: session.user.name || session.user.email || "Admin",
    });
    return NextResponse.json(giftCard);
  } catch (error) {
    if (error instanceof GiftCardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/gift-cards/[id]/reactivate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
