import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement } from "react";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import GiftCard from "@/models/GiftCard";
import SiteSettings from "@/models/SiteSettings";
import GiftCardPdf from "@/lib/giftcard-pdf";

/**
 * GET /api/gift-cards/[id]/pdf
 * Génère le PDF imprimable d'une carte cadeau (admin), avec le template configuré.
 */
export async function GET(
  _req: NextRequest,
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
      return NextResponse.json({ error: "Carte cadeau introuvable" }, { status: 404 });
    }

    const settings = await SiteSettings.findOne().select("shopName giftCards").lean();

    const pdfBuffer = await renderToBuffer(
      React.createElement(GiftCardPdf, {
        shopName: settings?.shopName || "Ma Boutique",
        amount: giftCard.initialAmount,
        code: giftCard.code,
        recipientName: giftCard.recipient?.name,
        message: giftCard.recipient?.message,
        expiresAt: giftCard.expiresAt,
        template: settings?.giftCards?.template,
      }) as ReactElement<DocumentProps>
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="carte-cadeau-${giftCard.code}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/gift-cards/[id]/pdf error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
