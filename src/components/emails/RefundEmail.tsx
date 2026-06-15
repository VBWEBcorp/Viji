import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface RefundEmailProps {
  orderNumber: string;
  customerName: string;
  amount: number;
  shopName?: string;
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateRefundEmail({
  orderNumber,
  customerName,
  amount,
}: RefundEmailProps): string {
  const formatPrice = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(v / 100);

  const content = `
    ${emailEyebrow("Remboursement")}
    ${emailHeading("Votre remboursement<br>est en route")}
    ${emailParagraph(
      `Bonjour ${esc(customerName)}, un remboursement a bien été effectué pour votre commande <strong style="color:${C.ink};">${esc(orderNumber)}</strong>.`
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;">
      <tr><td align="center" style="background:${C.softCream}; border:1px solid ${C.border}; border-radius:12px; padding:28px 24px;">
        <p style="font-family:${SANS}; font-size:11px; letter-spacing:0.25em; text-transform:uppercase; color:${C.muted}; margin:0 0 8px;">Montant remboursé</p>
        <p style="font-family:Georgia,serif; font-size:40px; font-weight:bold; color:${C.goldDark}; margin:0;">${formatPrice(amount)}</p>
      </td></tr>
    </table>

    ${emailParagraph(
      `<span style="color:${C.muted}; font-size:14px;">Le remboursement apparaîtra sur votre compte sous 5 à 10 jours ouvrables, selon votre banque.</span>`
    )}
  `;

  return emailShell({
    title: "Remboursement de votre commande",
    preheader: `Remboursement de ${formatPrice(amount)} pour la commande ${orderNumber}.`,
    content,
  });
}
