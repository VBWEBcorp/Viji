import type { IGiftCard } from "@/models/GiftCard";
import type { GiftCardTemplate } from "@/components/shop/GiftCardVisual";

const GOLD = "#b8923c";
const GOLD_DARK = "#9c7a2e";
const CREAM = "#faf7f1";

function fmt(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}

/**
 * Visuel HTML de la carte cadeau (compatible email : table + styles inline).
 * Réutilisé dans les emails acheteur et destinataire.
 */
function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function cardVisual(opts: {
  shopName: string;
  amount: number;
  code: string;
  recipientName?: string;
  message?: string;
  expiresAt?: Date | string | null;
  template?: GiftCardTemplate;
}): string {
  const { shopName, amount, code, recipientName, message, expiresAt, template } = opts;
  const primary = template?.primaryColor || GOLD;
  const bg = template?.backgroundColor || CREAM;
  const headline = template?.headline || "Carte cadeau";
  const logo = template?.logoUrl;
  const footer = template?.footerText;
  const header = logo
    ? `<img src="${esc(logo)}" alt="${esc(shopName)}" style="max-height:40px; margin:0 auto 16px; display:block;" />`
    : `<p style="font-size:10px; letter-spacing:0.4em; text-transform:uppercase; color:${primary}; margin:0 0 18px;">${esc(shopName)}</p>`;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px; width:100%; background:linear-gradient(135deg, #fffdf8 0%, ${bg} 100%); border:1px solid ${primary}33; border-radius:0;">
        <tr><td style="padding:36px 32px; text-align:center;">
          ${header}
          <p style="font-family:Georgia, 'Times New Roman', serif; font-size:13px; letter-spacing:0.25em; text-transform:uppercase; color:#6b7280; margin:0 0 6px;">${esc(headline)}</p>
          ${recipientName ? `<p style="font-family:Georgia, serif; font-size:20px; color:#111827; margin:8px 0 0;">Pour ${esc(recipientName)}</p>` : ""}
          <p style="font-family:Georgia, serif; font-size:48px; font-weight:bold; color:${GOLD_DARK}; margin:14px 0 6px;">${fmt(amount)}</p>
          ${message ? `<p style="font-family:Georgia, serif; font-style:italic; font-size:13px; color:#6b7280; margin:6px 0 16px;">«&nbsp;${esc(message)}&nbsp;»</p>` : ""}
          <div style="margin-top:18px; padding:14px 16px; background:#1f1d1a; border-radius:8px;">
            <p style="font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:#cbb88f; margin:0 0 6px;">Code</p>
            <p style="font-family:'Courier New', monospace; font-size:22px; font-weight:bold; letter-spacing:0.18em; color:#ffffff; margin:0;">${esc(code)}</p>
          </div>
          ${expiresAt ? `<p style="font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#9ca3af; margin:16px 0 0;">Valable jusqu'au ${fmtDate(expiresAt)}</p>` : ""}
          ${footer ? `<p style="font-size:11px; color:#6b7280; margin:12px 0 0;">${esc(footer)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

function wrapper(shopName: string, inner: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:${CREAM}; margin:0; padding:0;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:48px 32px;">
    ${inner}
    <div style="text-align:center; padding-top:28px; margin-top:28px; border-top:1px solid #eee; color:#9ca3af; font-size:12px;">
      <p style="margin:0;">© ${new Date().getFullYear()} ${esc(shopName)}</p>
    </div>
  </div>
</body></html>`;
}

function howToUse(): string {
  return `
  <div style="background:${CREAM}; padding:18px 20px; margin-top:8px;">
    <p style="font-size:13px; font-weight:600; color:#111827; margin:0 0 10px;">Comment l'utiliser&nbsp;?</p>
    <ol style="font-size:13px; color:#374151; line-height:1.7; margin:0; padding-left:18px;">
      <li>Composez votre commande sur la boutique</li>
      <li>Au paiement, saisissez le code de la carte cadeau</li>
      <li>Le montant est déduit automatiquement du total</li>
    </ol>
  </div>`;
}

export function generateGiftCardBuyerEmail(props: {
  giftCard: IGiftCard;
  shopName: string;
  template?: GiftCardTemplate;
}): string {
  const { giftCard, shopName, template } = props;
  const buyerName = giftCard.purchasedBy?.name || "";
  const sentToRecipient = Boolean(giftCard.recipient?.email);

  const inner = `
    <p style="font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${GOLD}; margin:0 0 20px;">${esc(shopName)}</p>
    <h1 style="font-family:Georgia, serif; font-size:26px; color:#111827; margin:0 0 18px;">Merci pour votre achat${buyerName ? `, ${esc(buyerName)}` : ""}</h1>
    <p style="font-size:15px; line-height:1.7; color:#374151; margin:0;">
      Votre carte cadeau de <strong>${fmt(giftCard.initialAmount)}</strong> a bien été créée.
      ${sentToRecipient
        ? `Elle a été envoyée directement à <strong>${esc(giftCard.recipient!.email!)}</strong> avec votre message.`
        : `Vous trouverez ci-dessous le code à transmettre au bénéficiaire.`}
    </p>
    ${cardVisual({
      shopName,
      amount: giftCard.initialAmount,
      code: giftCard.code,
      recipientName: giftCard.recipient?.name,
      message: giftCard.recipient?.message,
      expiresAt: giftCard.expiresAt,
      template,
    })}
    ${howToUse()}`;

  return wrapper(shopName, inner);
}

export function generateGiftCardRecipientEmail(props: {
  giftCard: IGiftCard;
  shopName: string;
  template?: GiftCardTemplate;
}): string {
  const { giftCard, shopName, template } = props;
  const recipientName = giftCard.recipient?.name || "";
  const buyerName = giftCard.purchasedBy?.name;

  const inner = `
    <p style="font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${GOLD}; margin:0 0 20px;">${esc(shopName)}</p>
    <h1 style="font-family:Georgia, serif; font-size:26px; color:#111827; margin:0 0 18px;">Une carte cadeau pour vous${recipientName ? `, ${esc(recipientName)}` : ""} 🎁</h1>
    <p style="font-size:15px; line-height:1.7; color:#374151; margin:0;">
      ${buyerName ? `<strong>${esc(buyerName)}</strong> vous offre` : "Vous avez reçu"} une carte cadeau ${shopName ? esc(shopName) : ""} d'une valeur de <strong>${fmt(giftCard.initialAmount)}</strong>.
    </p>
    ${cardVisual({
      shopName,
      amount: giftCard.initialAmount,
      code: giftCard.code,
      recipientName: giftCard.recipient?.name,
      message: giftCard.recipient?.message,
      expiresAt: giftCard.expiresAt,
      template,
    })}
    ${howToUse()}`;

  return wrapper(shopName, inner);
}
