import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "entremamanetmoicook@gmail.com";

const itemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.number().int().min(0),
});

const schema = z
  .object({
    name: z.string().min(1, "Nom requis").max(120),
    phone: z.string().min(6, "Téléphone requis").max(40),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    pickupDate: z.string().min(1, "Date de retrait requise"),
    pickupTime: z.string().min(1, "Créneau de retrait requis"),
    /** Liste structurée des plats sélectionnés (depuis la grille). */
    items: z.array(itemSchema).optional(),
    /** Commentaire libre du client (allergies, demandes particulières, etc.). */
    comment: z.string().max(2000).optional().or(z.literal("")),
    /** Ancien champ « commande en texte libre » (rétrocompat / cas sans menu). */
    order: z.string().max(2000).optional().or(z.literal("")),
    // Anti-spam honeypot
    website: z.string().max(0).optional(),
  })
  .refine(
    (d) =>
      (d.items && d.items.length > 0) ||
      (d.order && d.order.trim().length > 0) ||
      (d.comment && d.comment.trim().length > 0),
    {
      message: "Sélectionnez au moins un plat ou détaillez votre commande.",
      path: ["items"],
    }
  );

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

    const items = data.items ?? [];
    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const itemsHtml =
      items.length > 0
        ? `<table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-top:8px;">
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
              <tr><td colspan="3" style="padding:14px 0 0;text-align:right;font-weight:700;color:#111827;">Total estimé : ${formatEUR(total)}</td></tr>
            </tbody>
          </table>`
        : "";

    const commentBlock =
      data.comment && data.comment.trim().length > 0
        ? `<div style="margin-top:24px;padding:16px;background:#faf6ee;border-left:3px solid #b08438;">
            <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0 0 8px;">Commentaire</p>
            <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(data.comment)}</p>
          </div>`
        : "";

    const legacyOrderBlock =
      items.length === 0 && data.order && data.order.trim().length > 0
        ? `<div style="margin-top:24px;padding:16px;background:#faf6ee;border-left:3px solid #b08438;">
            <p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0 0 8px;">Commande</p>
            <p style="font-size:14px;color:#374151;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(data.order)}</p>
          </div>`
        : "";

    const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf6ee;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;padding:40px 32px;">
    <p style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#b08438;margin:0 0 16px;">Nouvelle réservation</p>
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#111827;margin:0 0 24px;">Click &amp; Collect · Entre Maman et Moi</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;color:#6b7280;width:160px;">Nom complet</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.name)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Téléphone</td><td style="padding:8px 0;color:#111827;font-weight:600;"><a href="tel:${escapeHtml(data.phone.replace(/\s/g, ""))}" style="color:#111827;text-decoration:none;">${escapeHtml(data.phone)}</a></td></tr>
      ${data.email ? `<tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#b08438;text-decoration:none;">${escapeHtml(data.email)}</a></td></tr>` : ""}
      <tr><td style="padding:8px 0;color:#6b7280;">Date de retrait</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.pickupDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Créneau</td><td style="padding:8px 0;color:#111827;font-weight:600;">${escapeHtml(data.pickupTime)}</td></tr>
    </table>
    ${itemsHtml ? `<div style="margin-top:24px;"><p style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#6b7280;margin:0;">Sélection</p>${itemsHtml}</div>` : ""}
    ${legacyOrderBlock}
    ${commentBlock}
    <p style="font-size:12px;color:#9ca3af;margin-top:32px;">Envoyé depuis le formulaire Click &amp; Collect du site.</p>
  </div>
</body></html>`;

    const replyToValue: string | undefined =
      data.email && data.email.length > 0 ? data.email : undefined;

    await sendEmail({
      to: TO_EMAIL,
      subject: `Click & Collect – ${data.name} – ${data.pickupDate} ${data.pickupTime}`,
      html,
      ...(replyToValue ? { replyTo: replyToValue } : {}),
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
