import crypto from "crypto";
import { sendEmail, sendBatchEmails } from "./resend";
import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailButton,
  emailDivider,
  esc,
  SHOP_NAME,
  EMAIL_COLORS,
} from "./email-layout";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
const UNSUB_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-only-insecure-secret-replace-in-prod";

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ── Désinscription : jeton signé (HMAC) pour ne pas exposer une désinscription
//    arbitraire d'un e-mail tiers, sans stocker un token par abonné. ──
export function unsubscribeToken(email: string): string {
  return crypto
    .createHmac("sha256", UNSUB_SECRET)
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function unsubscribeUrl(email: string): string {
  return `${SITE_URL}/api/newsletter/unsubscribe?e=${encodeURIComponent(
    email
  )}&t=${unsubscribeToken(email)}`;
}

/** Petite mention de désinscription, à placer en bas du contenu d'un e-mail. */
function unsubscribeNote(email: string): string {
  return `<p style="font-family:${SANS}; font-size:12px; line-height:1.6; color:${EMAIL_COLORS.muted}; margin:0;">
    Vous recevez cet e-mail car cette adresse est inscrite à la newsletter de ${esc(
      SHOP_NAME
    )}.
    <a href="${unsubscribeUrl(email)}" style="color:${EMAIL_COLORS.goldDark}; text-decoration:underline;">Se désinscrire</a>.
  </p>`;
}

/** Mail de bienvenue envoyé au nouvel abonné. Best-effort (ne lève pas). */
export async function sendNewsletterWelcome(email: string) {
  const content =
    emailEyebrow("Newsletter") +
    emailHeading("Bienvenue ! 🎉") +
    emailParagraph("Bonjour,") +
    emailParagraph(
      `Merci de votre inscription à la newsletter de <strong>${esc(
        SHOP_NAME
      )}</strong>.`
    ) +
    emailParagraph(
      "Vous recevrez désormais nos actualités, recettes et nouveautés directement dans votre boîte mail."
    ) +
    (SITE_URL
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;"><tr><td>${emailButton(
          SITE_URL,
          "Visiter la boutique"
        )}</td></tr></table>`
      : "") +
    emailDivider() +
    unsubscribeNote(email);

  return sendEmail({
    to: email,
    subject: `Bienvenue dans la newsletter de ${SHOP_NAME}`,
    html: emailShell({
      title: `Bienvenue dans la newsletter de ${SHOP_NAME}`,
      preheader: "Merci de votre inscription à notre newsletter.",
      content,
    }),
  });
}

/** Construit le HTML d'une campagne pour un destinataire donné. */
function buildCampaignHtml(
  subject: string,
  message: string,
  email: string
): string {
  // Texte saisi par l'admin → paragraphes ; HTML échappé par sécurité.
  const paragraphs = message
    .trim()
    .split(/\n{2,}/)
    .map((p) => emailParagraph(esc(p).replace(/\n/g, "<br>")))
    .join("");

  const content =
    emailEyebrow("Newsletter") +
    emailHeading(esc(subject)) +
    paragraphs +
    emailDivider() +
    unsubscribeNote(email);

  return emailShell({ title: subject, preheader: subject, content });
}

/**
 * Envoie une campagne à une liste d'abonnés (lien de désinscription
 * personnalisé par destinataire). Ne lève pas : renvoie le décompte.
 */
export async function sendCampaign(
  recipients: string[],
  subject: string,
  message: string
): Promise<{ sent: number; failed: number; total: number }> {
  const total = recipients.length;
  const messages = recipients.map((email) => ({
    to: email,
    subject,
    html: buildCampaignHtml(subject, message, email),
  }));
  const { sent, failed } = await sendBatchEmails(messages);
  return { sent, failed, total };
}
