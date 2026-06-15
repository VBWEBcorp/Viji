import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface ReviewRequestEmailProps {
  customerName: string;
  orderNumber: string;
  products: { name: string; slug: string; image?: string }[];
  shopName?: string;
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateReviewRequestEmail({
  customerName,
  orderNumber,
  products,
}: ReviewRequestEmailProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const productRows = products
    .map(
      (p) => `
      <tr><td style="padding:8px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.softCream}; border:1px solid ${C.border}; border-radius:10px;">
          <tr>
            ${
              p.image
                ? `<td style="padding:12px 0 12px 14px; width:62px;"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="50" height="50" style="border-radius:8px; display:block; object-fit:cover;" /></td>`
                : ""
            }
            <td style="padding:14px 16px; font-family:${SANS}; font-size:14px; font-weight:600; color:${C.ink};">${esc(p.name)}</td>
            <td style="padding:14px 16px; text-align:right; white-space:nowrap;">
              <a href="${appUrl}/products/${esc(p.slug)}#reviews" style="font-family:${SANS}; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${C.gold}; text-decoration:none; border-bottom:1px solid ${C.gold}; padding-bottom:2px;">Donner mon avis</a>
            </td>
          </tr>
        </table>
      </td></tr>`
    )
    .join("");

  const content = `
    ${emailEyebrow("Votre avis")}
    ${emailHeading("Comment s'est passé<br>votre voyage culinaire ?")}
    ${emailParagraph(
      `Bonjour ${esc(customerName)}, nous espérons que votre commande <strong style="color:${C.ink};">${esc(orderNumber)}</strong> vous a régalée. Votre avis est précieux et guide les prochains gourmands.`
    )}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 6px;">
      ${productRows}
    </table>
  `;

  return emailShell({
    title: "Votre avis nous intéresse",
    preheader: "Partagez votre avis sur votre commande.",
    content,
  });
}
