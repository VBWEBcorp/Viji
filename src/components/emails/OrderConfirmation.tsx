import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailInfoBox,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  giftCardAmount?: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateOrderConfirmationEmail(
  props: OrderConfirmationProps
): string {
  const fmt = (amount: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);

  const itemRows = props.items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.ink};">${esc(item.name)}</td>
        <td style="padding:14px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.muted}; text-align:center; width:54px;">×${item.quantity}</td>
        <td style="padding:14px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.ink}; font-weight:600; text-align:right; width:90px;">${fmt(item.unitPrice * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const totalLine = (
    label: string,
    value: string,
    opts?: { color?: string; bold?: boolean }
  ) => `
    <tr>
      <td style="padding:5px 0; font-family:${SANS}; font-size:14px; color:${opts?.color || C.body};">${label}</td>
      <td style="padding:5px 0; font-family:${SANS}; font-size:14px; text-align:right; color:${opts?.color || C.ink}; font-weight:${opts?.bold ? 700 : 400};">${value}</td>
    </tr>`;

  const giftCard = props.giftCardAmount || 0;
  const cardPaid = Math.max(0, props.total - giftCard);

  const content = `
    ${emailEyebrow("Commande confirmée")}
    ${emailHeading(`Merci pour votre commande,<br>${esc(props.customerName)} !`)}
    ${emailParagraph(
      `Votre commande <strong style="color:${C.ink};">${esc(props.orderNumber)}</strong> a bien été enregistrée. Nous la préparons avec soin, voici le récapitulatif.`
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;">
      <thead>
        <tr>
          <th style="padding:0 0 10px; font-family:${SANS}; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:${C.muted}; text-align:left; font-weight:600; border-bottom:2px solid ${C.border};">Article</th>
          <th style="padding:0 0 10px; font-family:${SANS}; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:${C.muted}; text-align:center; font-weight:600; border-bottom:2px solid ${C.border};">Qté</th>
          <th style="padding:0 0 10px; font-family:${SANS}; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:${C.muted}; text-align:right; font-weight:600; border-bottom:2px solid ${C.border};">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 6px;">
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:280px; margin-left:auto;">
          ${totalLine("Sous-total", fmt(props.subtotal))}
          ${props.discount > 0 ? totalLine("Réduction", `-${fmt(props.discount)}`, { color: "#15803d" }) : ""}
          ${totalLine("Livraison", props.shippingCost === 0 ? "Offerte" : fmt(props.shippingCost))}
          ${giftCard > 0 ? totalLine("Carte cadeau", `-${fmt(giftCard)}`, { color: C.gold }) : ""}
          <tr><td colspan="2" style="padding:8px 0 0;"><div style="border-top:1px solid ${C.border};"></div></td></tr>
          ${totalLine("Total", fmt(props.total), { bold: true })}
          ${giftCard > 0 ? `<tr><td colspan="2" style="padding:4px 0 0; font-family:${SANS}; font-size:12px; color:${C.muted}; text-align:right;">Réglé par carte : ${fmt(cardPaid)}</td></tr>` : ""}
        </table>
      </td></tr>
    </table>

    <p style="font-family:${SANS}; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:${C.muted}; margin:28px 0 0;">Adresse de livraison</p>
    ${emailInfoBox(
      `<p style="font-family:${SANS}; font-size:14px; line-height:1.6; color:${C.body}; margin:0;">
        <strong style="color:${C.ink};">${esc(props.shippingAddress.name)}</strong><br>
        ${esc(props.shippingAddress.street)}<br>
        ${esc(props.shippingAddress.zip)} ${esc(props.shippingAddress.city)}<br>
        ${esc(props.shippingAddress.country)}
      </p>`
    )}

    ${emailParagraph(
      `<span style="color:${C.muted}; font-size:14px;">Vous recevrez un nouvel email dès que votre commande sera expédiée. À très vite !</span>`
    )}
  `;

  return emailShell({
    title: `Confirmation de commande ${props.orderNumber}`,
    preheader: `Votre commande ${props.orderNumber} est confirmée. Merci !`,
    content,
  });
}
