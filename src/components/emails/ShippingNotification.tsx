import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailButton,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface ShippingNotificationProps {
  orderNumber: string;
  customerName: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateShippingNotificationEmail(
  props: ShippingNotificationProps
): string {
  const detailRow = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0; font-family:${SANS}; font-size:13px; color:${C.muted}; width:130px;">${label}</td>
      <td style="padding:6px 0; font-family:${SANS}; font-size:14px; color:${C.ink}; font-weight:600;">${value}</td>
    </tr>`;

  const trackingBlock = props.trackingNumber
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
        <tr><td style="background:${C.softCream}; border:1px solid ${C.border}; border-radius:10px; padding:22px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${detailRow("Transporteur", esc(props.carrier || "Non précisé"))}
            ${detailRow("N° de suivi", esc(props.trackingNumber))}
          </table>
          ${
            props.trackingUrl
              ? `<div style="margin-top:18px;">${emailButton(props.trackingUrl, "Suivre mon colis")}</div>`
              : ""
          }
        </td></tr>
      </table>`
    : "";

  const content = `
    ${emailEyebrow("Expédition")}
    ${emailHeading("Votre commande est en route !")}
    ${emailParagraph(
      `Bonjour ${esc(props.customerName)}, bonne nouvelle : votre commande <strong style="color:${C.ink};">${esc(props.orderNumber)}</strong> vient d'être expédiée.`
    )}
    ${trackingBlock}
    ${emailParagraph(
      `<span style="color:${C.muted}; font-size:14px;">Encore un peu de patience, votre voyage culinaire arrive bientôt.</span>`
    )}
  `;

  return emailShell({
    title: "Votre commande est en route",
    preheader: `Votre commande ${props.orderNumber} a été expédiée.`,
    content,
  });
}
