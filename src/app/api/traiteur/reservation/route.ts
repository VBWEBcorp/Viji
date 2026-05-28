import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { computeTraiteurAmount } from "@/lib/traiteur";
import Reservation from "@/models/Reservation";
import { generateReservationNumber } from "@/lib/utils";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "entremamanetmoicook@gmail.com";

const schema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
  phone: z.string().min(6, "Téléphone requis").max(40),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  pickupDate: z.string().min(1, "Date de retrait requise"),
  pickupTime: z.string().min(1, "Créneau de retrait requis"),
  /** Plats sélectionnés : identifiants + quantités. Les prix sont recalculés en base. */
  items: z
    .array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
    .min(1, "Sélectionnez au moins un plat."),
  /** Commentaire libre du client (allergies, demandes particulières, etc.). */
  comment: z.string().max(2000).optional().or(z.literal("")),
  // Paiement Stripe confirmé côté client : on le re-vérifie ici avant d'enregistrer.
  stripePaymentIntentId: z.string().regex(/^pi_/, "Paiement invalide"),
  // Anti-spam honeypot
  website: z.string().max(0).optional(),
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}

function formatEUR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (data.website) return NextResponse.json({ ok: true });

    await connectDB();

    // Recalcule montant + lignes (nom, prix) depuis la base : les valeurs envoyées
    // par le client ne sont jamais utilisées pour le montant ni l'email.
    const computed = await computeTraiteurAmount(data.items);
    if (!computed) {
      return NextResponse.json(
        { error: "Un plat sélectionné n'est plus disponible." },
        { status: 400 }
      );
    }

    // Vérification du paiement auprès de Stripe.
    const stripe = await getStripe();
    const pi = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);

    if (pi.metadata?.kind !== "traiteur") {
      return NextResponse.json({ error: "Paiement invalide" }, { status: 400 });
    }
    if (pi.metadata?.fulfilled === "true") {
      // Anti-rejeu : ce paiement a déjà donné lieu à une commande enregistrée.
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: `Le paiement n'a pas été confirmé (statut : ${pi.status})` },
        { status: 400 }
      );
    }
    if (pi.amount !== computed.amount) {
      return NextResponse.json(
        { error: "Montant du paiement incorrect" },
        { status: 400 }
      );
    }

    // Dédoublonnage robuste : si une commande existe déjà pour ce paiement.
    const already = await Reservation.findOne({ paymentId: pi.id }).lean();
    if (already) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const items = computed.lines;
    const total = computed.amount;

    // Persistance : la commande Click & Collect devient visible dans l'admin.
    await Reservation.create({
      reservationNumber: generateReservationNumber(),
      type: "traiteur",
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email || undefined,
      items,
      pickupDate: data.pickupDate,
      pickupTime: data.pickupTime,
      notes: data.comment || undefined,
      amount: total,
      paymentId: pi.id,
      status: "pending",
    });

    const itemsHtml = `<table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-top:8px;">
            <thead>
              <tr style="border-bottom:1px solid #e5e7eb;">
                <th style="text-align:left;padding:8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;font-weight:600;">Plat</th>
                <th style="text-align:center;padding:8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;font-weight:600;width:60px;">Qté</th>
                <th style="text-align:right;padding:8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;font-weight:600;width:80px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (i) =>
                    `<tr style="border-bottom:1px solid #f3f4f6;">
                      <td style="padding:10px 0;color:#111827;">${escapeHtml(i.name)}</td>
                      <td style="padding:10px 0;text-align:center;color:#374151;">${i.quantity}</td>
                      <td style="padding:10px 0;text-align:right;color:#111827;font-weight:600;">${formatEUR(i.unitPrice * i.quantity)}</td>
                    </tr>`
                )
                .join("")}
              <tr><td colspan="3" style="padding:14px 0 0;text-align:right;font-weight:700;color:#15803d;">Payé en ligne : ${formatEUR(total)}</td></tr>
            </tbody>
          </table>`;

    const commentBlock =
      data.comment && data.comment.trim().length > 0
        ? `<div style="margin-top:24px;padding:16px;background:#faf6ee;border-left:3px solid #b08438;">
            <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0 0 8px;">Commentaire</p>
            <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(data.comment)}</p>
          </div>`
        : "";

    const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf6ee;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;">
    <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#b08438;margin:0 0 16px;">Nouvelle commande payée</p>
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#111827;margin:0 0 24px;">Click &amp; Collect · Entre Maman et Moi</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Nom complet</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Téléphone</td><td style="padding:8px 0;color:#111827;font-weight:600;"><a href="tel:${escapeHtml(data.phone.replace(/\s/g, ""))}" style="color:#111827;text-decoration:none;">${escapeHtml(data.phone)}</a></td></tr>
      ${data.email ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#b08438;text-decoration:none;">${escapeHtml(data.email)}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b7280;">Date de retrait</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.pickupDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Créneau</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.pickupTime)}</td></tr>
    </table>
    <div style="margin-top:24px;"><p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0;">Sélection</p>${itemsHtml}</div>
    ${commentBlock}
    <p style="font-size:12px;color:#9ca3af;margin-top:32px;">Envoyé depuis le formulaire Click &amp; Collect du site.</p>
  </div>
</body></html>`;

    const replyToValue: string | undefined =
      data.email && data.email.length > 0 ? data.email : undefined;

    await sendEmail({
      to: TO_EMAIL,
      subject: `Click & Collect PAYÉ – ${data.name} – ${data.pickupDate} ${data.pickupTime}`,
      html,
      ...(replyToValue ? { replyTo: replyToValue } : {}),
    });

    // Marque le paiement comme traité pour empêcher tout rejeu.
    await stripe.paymentIntents.update(data.stripePaymentIntentId, {
      metadata: { ...pi.metadata, fulfilled: "true" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/traiteur/reservation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
