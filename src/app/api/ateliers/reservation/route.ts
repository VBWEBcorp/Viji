import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";
import { connectDB } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { resolveAtelierUnitPrice } from "@/lib/ateliers";
import Reservation from "@/models/Reservation";
import { generateReservationNumber } from "@/lib/utils";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "entremamanetmoicook@gmail.com";

const schema = z.object({
  sessionSlug: z.string().min(1),
  sessionTitle: z.string().min(1),
  sessionDate: z.string().min(1),
  /** Lieu choisi (extrait de l'occurrence sélectionnée). */
  sessionLocation: z.string().max(200).optional().or(z.literal("")),
  name: z.string().min(1, "Nom requis").max(120),
  phone: z.string().min(6, "Téléphone requis").max(40),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  participants: z.coerce.number().int().min(1).max(20),
  notes: z.string().max(2000).optional().or(z.literal("")),
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

    // Le prix fait foi côté serveur : on recalcule le montant attendu à partir
    // de l'atelier en base, jamais d'une valeur envoyée par le client.
    const unitPrice = await resolveAtelierUnitPrice(data.sessionSlug);
    if (unitPrice === null) {
      return NextResponse.json(
        { error: "Atelier introuvable ou indisponible" },
        { status: 404 }
      );
    }
    const expectedAmount = unitPrice * data.participants;

    // Vérification du paiement auprès de Stripe : ne jamais croire le frontend
    // sur le simple fait qu'un paiement a eu lieu.
    const stripe = await getStripe();
    const pi = await stripe.paymentIntents.retrieve(data.stripePaymentIntentId);

    if (pi.metadata?.kind !== "atelier") {
      return NextResponse.json({ error: "Paiement invalide" }, { status: 400 });
    }
    if (pi.metadata?.fulfilled === "true") {
      // Anti-rejeu : ce paiement a déjà donné lieu à une réservation enregistrée.
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }
    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: `Le paiement n'a pas été confirmé (statut : ${pi.status})` },
        { status: 400 }
      );
    }
    if (pi.amount !== expectedAmount) {
      return NextResponse.json(
        { error: "Montant du paiement incorrect" },
        { status: 400 }
      );
    }

    // Dédoublonnage robuste : si une réservation existe déjà pour ce paiement,
    // on ne recrée pas (ex. double soumission réseau).
    const already = await Reservation.findOne({ paymentId: pi.id }).lean();
    if (already) {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    // Persistance : la réservation devient visible dans l'admin (source de vérité).
    await Reservation.create({
      reservationNumber: generateReservationNumber(),
      type: "atelier",
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email || undefined,
      atelierSlug: data.sessionSlug,
      atelierTitle: data.sessionTitle,
      sessionDate: data.sessionDate,
      sessionLocation: data.sessionLocation || undefined,
      participants: data.participants,
      notes: data.notes || undefined,
      amount: pi.amount,
      paymentId: pi.id,
      status: "pending",
    });

    const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf6ee;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;">
    <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#b08438;margin:0 0 16px;">Nouvelle réservation atelier</p>
    <h1 style="font-family:Georgia,serif;font-size:22px;color:#111827;margin:0 0 8px;">${escapeHtml(data.sessionTitle)}</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">${escapeHtml(data.sessionDate)}</p>
    ${data.sessionLocation ? `<p style="font-size:13px;color:#b08438;font-weight:600;margin:0 0 28px;">${escapeHtml(data.sessionLocation)}</p>` : `<div style="margin-bottom:28px;"></div>`}
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Nom complet</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Téléphone</td><td style="padding:8px 0;color:#111827;font-weight:600;"><a href="tel:${escapeHtml(data.phone.replace(/\s/g, ""))}" style="color:#111827;text-decoration:none;">${escapeHtml(data.phone)}</a></td></tr>
      ${data.email ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#b08438;text-decoration:none;">${escapeHtml(data.email)}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b7280;">Participants</td><td style="padding:8px 0;color:#111827;font-weight:600;">${data.participants}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Paiement</td><td style="padding:8px 0;color:#15803d;font-weight:700;">Payé en ligne · ${formatEUR(pi.amount)}</td></tr>
    </table>
    ${data.notes ? `<div style="margin-top:24px;padding:16px;background:#faf6ee;border-left:3px solid #b08438;">
      <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0 0 8px;">Notes / allergies</p>
      <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(data.notes)}</p>
    </div>` : ""}
    <p style="font-size:12px;color:#9ca3af;margin-top:32px;">Envoyé depuis la page atelier (${escapeHtml(data.sessionSlug)}).</p>
  </div>
</body></html>`;

    const replyToValue: string | undefined =
      data.email && data.email.length > 0 ? data.email : undefined;

    await sendEmail({
      to: TO_EMAIL,
      subject: `Réservation atelier PAYÉE – ${data.name} – ${data.sessionTitle}`,
      html,
      ...(replyToValue ? { replyTo: replyToValue } : {}),
    });

    // Marque le paiement comme traité pour empêcher tout rejeu (double envoi
    // si le client renvoie la requête avec le même PaymentIntent).
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
    console.error("POST /api/ateliers/reservation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
