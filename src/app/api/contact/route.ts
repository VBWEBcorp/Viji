import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || "entremamanetmoicook@gmail.com";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();
    const subject = String(data.subject || "").trim();
    const message = String(data.message || "").trim();
    const honeypot = String(data._gotcha || "").trim();
    const formType = String(data.formType || "contact");

    // Honeypot anti-spam : si rempli, ignore silencieusement
    if (honeypot) {
      return NextResponse.json({ ok: true });
    }

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nom, email et message sont obligatoires." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const subjectLine =
      formType === "devis"
        ? `Demande de devis traiteur · ${name}`
        : subject
        ? `[Contact] ${subject}`
        : `[Contact] Message de ${name}`;

    // Optional fields for the catering quote form
    const phone = String(data.phone || "").trim();
    const date = String(data.date || "").trim();
    const guests = String(data.guests || "").trim();

    const html = `
      <div style="font-family:Helvetica,Arial,sans-serif;color:#1f1d1a;line-height:1.6;">
        <h2 style="font-family:Georgia,serif;color:#b8923c;margin:0 0 16px;">
          ${formType === "devis" ? "Nouvelle demande de devis" : "Nouveau message du site"}
        </h2>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#777;width:130px;">De</td>
            <td style="padding:8px 0;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</td>
          </tr>
          ${phone ? `<tr><td style="padding:8px 0;color:#777;">Téléphone</td><td style="padding:8px 0;">${escapeHtml(phone)}</td></tr>` : ""}
          ${date ? `<tr><td style="padding:8px 0;color:#777;">Date événement</td><td style="padding:8px 0;">${escapeHtml(date)}</td></tr>` : ""}
          ${guests ? `<tr><td style="padding:8px 0;color:#777;">Convives</td><td style="padding:8px 0;">${escapeHtml(guests)}</td></tr>` : ""}
          ${subject ? `<tr><td style="padding:8px 0;color:#777;">Sujet</td><td style="padding:8px 0;">${escapeHtml(subject)}</td></tr>` : ""}
        </table>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="white-space:pre-wrap;font-size:14px;">${escapeHtml(message)}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-size:11px;color:#999;">
          Envoyé depuis le formulaire ${formType === "devis" ? "de devis traiteur" : "de contact"} d'<em>Entre Maman et Moi</em>.
          Tu peux répondre directement à cet email — la réponse partira à <strong>${escapeHtml(email)}</strong>.
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: TO_EMAIL,
      subject: subjectLine,
      html,
      replyTo: email,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Service d'envoi indisponible (clé Resend manquante)" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/contact error:", e);
    return NextResponse.json(
      { error: "Impossible d'envoyer le message." },
      { status: 500 }
    );
  }
}
