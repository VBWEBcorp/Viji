import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement } from "react";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Order from "@/models/Order";
import SiteSettings from "@/models/SiteSettings";
import InvoiceDocument from "@/lib/invoice";

/**
 * GET /api/orders/[id]/invoice
 * Génère et retourne la facture PDF d'une commande.
 * - Le client peut télécharger la facture de ses propres commandes (et seulement si paid)
 * - L'admin peut télécharger n'importe quelle facture
 * - Si invoiceNumber n'existe pas encore et que la commande est payée, on l'attribue
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Vérification d'autorisation
    const isAdmin = session.user.role === "admin";
    const isOwner = order.user.toString() === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    // Pas de facture pour les commandes non payées (sauf admin qui peut prévisualiser)
    if (!isAdmin && order.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "Facture disponible apres paiement" },
        { status: 400 }
      );
    }

    const settings = await SiteSettings.findOne();
    if (!settings) {
      return NextResponse.json({ error: "Reglages introuvables" }, { status: 500 });
    }

    if (settings.invoice?.enabled === false) {
      return NextResponse.json(
        { error: "Facturation desactivee" },
        { status: 400 }
      );
    }

    // Attribuer un numéro de facture séquentiel si pas encore fait (uniquement si payé)
    if (!order.invoiceNumber && order.paymentStatus === "paid") {
      const prefix = settings.invoice?.prefix || "FAC-";
      const year = new Date().getFullYear();
      const num = settings.invoice?.nextNumber ?? 1;
      order.invoiceNumber = `${prefix}${year}-${String(num).padStart(4, "0")}`;
      order.invoiceIssuedAt = new Date();
      await order.save();

      settings.invoice.nextNumber = num + 1;
      await settings.save();
    }

    // Génération PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, {
        order: order.toObject(),
        settings: settings.toObject(),
      }) as ReactElement<DocumentProps>
    );

    const filename = `${order.invoiceNumber || order.orderNumber}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/orders/[id]/invoice error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
