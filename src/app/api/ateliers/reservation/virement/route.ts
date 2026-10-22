import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { getNotificationEmail } from "@/lib/notify";
import { buildAtelierCustomerEmail, getCoordonneesBoutique } from "@/lib/reservation-emails";
import { connectDB } from "@/lib/db";
import { resolveAtelierUnitPrice } from "@/lib/ateliers";
import { getEtatCanal, messageCanalFerme } from "@/lib/disponibilite";
import { compteUtilisation, resoutPromo } from "@/lib/promo";
import { ribPourAteliers } from "@/lib/virement";
import Reservation from "@/models/Reservation";
import { generateReservationNumber } from "@/lib/utils";

const schema = z.object({
  sessionSlug: z.string().min(1),
  sessionTitle: z.string().min(1),
  sessionDate: z.string().min(1),
  sessionLocation: z.string().max(200).optional().or(z.literal("")),
  name: z.string().min(1, "Nom requis").max(120),
  phone: z.string().min(6, "Téléphone requis").max(40),
  email: z.string().email("Email invalide"),
  participants: z.coerce.number().int().min(1).max(20),
  notes: z.string().max(2000).optional().or(z.literal("")),
  promoCode: z.string().trim().max(40).optional(),
  // Anti-spam honeypot
  website: z.string().max(0).optional(),
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
}

function formatEUR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

/**
 * POST /api/ateliers/reservation/virement : réservation d'atelier réglée par
 * virement (Réglages → Virement → ateliers). Aucune carte : la réservation est
 * enregistrée, le client reçoit le RIB et la référence à indiquer, la boutique
 * est prévenue qu'un virement est à recevoir. Le montant est recalculé ici.
 */
export async function POST(req: NextRequest) {
  try {
    const data = schema.parse(await req.json());
    if (data.website) return NextResponse.json({ ok: true });

    await connectDB();

    const etat = await getEtatCanal("ateliers");
    if (!etat.ouvert) return NextResponse.json({ error: messageCanalFerme(etat) }, { status: 503 });

    const rib = await ribPourAteliers();
    if (!rib) {
      return NextResponse.json({ error: "Le règlement par virement n'est pas disponible. Réservez par carte." }, { status: 409 });
    }

    const unitPrice = await resolveAtelierUnitPrice(data.sessionSlug);
    if (unitPrice === null) return NextResponse.json({ error: "Atelier introuvable ou indisponible" }, { status: 404 });
    const subtotal = unitPrice * data.participants;

    let discount = 0;
    let promoCode = "";
    if (data.promoCode) {
      const promo = await resoutPromo(data.promoCode, subtotal);
      if (!promo.ok) return NextResponse.json({ error: promo.error }, { status: 400 });
      discount = promo.discount;
      promoCode = promo.promo.code;
    }
    const amount = Math.max(0, subtotal - discount);

    const reservationNumber = generateReservationNumber();
    await Reservation.create({
      reservationNumber,
      type: "atelier",
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email,
      atelierSlug: data.sessionSlug,
      atelierTitle: data.sessionTitle,
      sessionDate: data.sessionDate,
      sessionLocation: data.sessionLocation || undefined,
      participants: data.participants,
      notes: data.notes || undefined,
      amount,
      promoCode: promoCode || undefined,
      discount: discount || undefined,
      paymentId: `virement-${reservationNumber}`,
      paymentMethod: "virement",
      status: "pending",
    });

    if (promoCode) {
      try {
        await compteUtilisation(promoCode);
      } catch (err) {
        console.error("Compteur du code promo non mis à jour:", err);
      }
    }

    // 1. Au client : récapitulatif, RIB et référence du virement.
    try {
      await sendEmail({
        to: data.email,
        subject: `Votre réservation : ${data.sessionTitle} (règlement par virement)`,
        html: buildAtelierCustomerEmail({
          reservationNumber,
          name: data.name,
          sessionTitle: data.sessionTitle,
          sessionDate: data.sessionDate,
          sessionLocation: data.sessionLocation || undefined,
          participants: data.participants,
          amount,
          promo: promoCode ? { code: promoCode, discount } : undefined,
          notes: data.notes || undefined,
          coordonnees: await getCoordonneesBoutique(),
          virement: rib,
        }),
        replyTo: await getNotificationEmail(),
        kind: "confirmation-atelier",
        reference: reservationNumber,
      });
    } catch (err) {
      console.error("Confirmation client (atelier, virement) non envoyée:", err);
    }

    // 2. À la boutique : un virement est à recevoir.
    try {
      const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf6ee;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;">
    <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#b08438;margin:0 0 16px;">Nouvelle réservation atelier · virement à recevoir</p>
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#111827;margin:0 0 8px;">${escapeHtml(data.sessionTitle)}</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 28px;">${escapeHtml(data.sessionDate)}${data.sessionLocation ? ` · ${escapeHtml(data.sessionLocation)}` : ""}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Nom complet</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Téléphone</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.phone)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#b08438;text-decoration:none;">${escapeHtml(data.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Participants</td><td style="padding:8px 0;color:#111827;font-weight:600;">${data.participants}</td></tr>
      ${promoCode ? `<tr><td style="padding:8px 0;color:#6b7280;">Code promo</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(promoCode)} · -${formatEUR(discount)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b7280;">Paiement</td><td style="padding:8px 0;color:#b45309;font-weight:700;">Virement à recevoir · ${formatEUR(amount)} · réf. ${escapeHtml(reservationNumber)}</td></tr>
    </table>
    ${data.notes ? `<p style="margin-top:24px;font-size:14px;color:#374151;white-space:pre-wrap;"><strong>Notes / allergies :</strong> ${escapeHtml(data.notes)}</p>` : ""}
  </div></body></html>`;
      await sendEmail({
        to: await getNotificationEmail(),
        subject: `Réservation atelier, VIREMENT À RECEVOIR : ${data.name} · ${data.sessionTitle}`,
        html,
        replyTo: data.email,
        kind: "notification-atelier",
        reference: reservationNumber,
      });
    } catch (err) {
      console.error("Notification interne (atelier, virement) non envoyée:", err);
    }

    return NextResponse.json({ ok: true, reservationNumber, amount, rib });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Données invalides" }, { status: 400 });
    }
    console.error("POST /api/ateliers/reservation/virement error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
