import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailButton,
  esc,
  EMAIL_COLORS as C,
} from "@/lib/email-layout";

interface WelcomeEmailProps {
  customerName: string;
  shopName?: string;
}

const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function generateWelcomeEmail({
  customerName,
}: WelcomeEmailProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const perk = (label: string) =>
    `<tr><td style="padding:7px 0; font-family:${SANS}; font-size:14px; color:${C.body};">
      <span style="color:${C.gold}; font-weight:700;">&#10003;</span>&nbsp;&nbsp;${label}
    </td></tr>`;

  const content = `
    ${emailEyebrow("Bienvenue")}
    ${emailHeading(`Ravis de vous accueillir,<br>${esc(customerName)} !`)}
    ${emailParagraph(
      `Votre compte est créé. Vous voilà prête à voyager au cœur de l'Inde depuis votre cuisine, avec nos box culinaires et nos ateliers.`
    )}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 26px;">
      ${perk("Commandez vos box en quelques clics")}
      ${perk("Suivez vos livraisons en temps réel")}
      ${perk("Réservez nos ateliers de cuisine")}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td>
      ${emailButton(`${appUrl}/kits/decouverte`, "Découvrir nos box")}
    </td></tr></table>
  `;

  return emailShell({
    title: "Bienvenue sur Entre Maman et Moi",
    preheader: "Votre compte est créé. Découvrez nos box culinaires indiennes.",
    content,
  });
}
