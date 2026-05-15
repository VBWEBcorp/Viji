import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/resend";

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
  // Anti-spam honeypot
  website: z.string().max(0).optional(),
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (data.website) return NextResponse.json({ ok: true });

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
      subject: `Réservation atelier – ${data.name} – ${data.sessionTitle}`,
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
    console.error("POST /api/ateliers/reservation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
