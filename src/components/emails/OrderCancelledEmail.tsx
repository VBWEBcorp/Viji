import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface OrderCancelledEmailProps {
  orderNumber: string;
  customerName: string;
  reason?: string;
  shopName?: string;
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateOrderCancelledEmail({
  orderNumber,
  customerName,
  reason,
}: OrderCancelledEmailProps): string {
  const content = `
    ${emailEyebrow("Commande annulée")}
    ${emailHeading("Votre commande<br>a été annulée")}
    ${emailParagraph(
      `Bonjour ${esc(customerName)}, votre commande <strong style="color:${C.ink};">${esc(orderNumber)}</strong> a été annulée.`
    )}
    ${
      reason
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 18px;">
            <tr><td style="background:${C.softCream}; border-left:3px solid ${C.gold}; border-radius:6px; padding:16px 20px;">
              <p style="font-family:${SANS}; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${C.muted}; margin:0 0 6px;">Motif</p>
              <p style="font-family:${SANS}; font-size:14px; line-height:1.6; color:${C.body}; margin:0;">${esc(reason)}</p>
            </td></tr>
          </table>`
        : ""
    }
    ${emailParagraph(
      `Si un paiement avait été effectué, le remboursement sera traité automatiquement sous 5 à 10 jours ouvrables.`
    )}
    ${emailParagraph(
      `<span style="color:${C.muted}; font-size:14px;">Une question ? Répondez simplement à cet email, nous sommes là pour vous aider.</span>`
    )}
  `;

  return emailShell({
    title: "Annulation de votre commande",
    preheader: `Votre commande ${orderNumber} a été annulée.`,
    content,
  });
}
