/**
 * Charte graphique commune à tous les emails transactionnels.
 * Identité "Entre Maman et Moi" : doré / crème / serif Georgia.
 *
 * Tous les styles sont inline (compatibilité Gmail/Outlook/Apple Mail) ; le
 * bloc <style> du shell n'ajoute que le responsive et reste optionnel.
 * `color-scheme: light only` empêche l'inversion automatique en mode sombre
 * (qui rendait certains textes illisibles).
 */

export const SHOP_NAME = "Entre Maman et Moi";
export const SHOP_TAGLINE = "Box culinaires indiennes & ateliers";

export const EMAIL_COLORS = {
  gold: "#b08438",
  goldDark: "#9c7a2e",
  goldLight: "#d8b46a",
  cream: "#faf6ee",
  softCream: "#f7f1e6",
  ink: "#1f1d1a",
  body: "#57514a",
  muted: "#9b948a",
  border: "#ece4d6",
  hairline: "#f0e9dc",
  white: "#ffffff",
};

const C = EMAIL_COLORS;
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}

/** Petit intitulé doré en majuscules espacées, au-dessus du titre. */
export function emailEyebrow(text: string): string {
  return `<p style="font-family:${SANS}; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${C.gold}; margin:0 0 14px;">${text}</p>`;
}

/** Titre principal en serif. Accepte du HTML simple (ex. <br>). */
export function emailHeading(html: string): string {
  return `<h1 class="emm-h1" style="font-family:${SERIF}; font-size:27px; line-height:1.25; font-weight:normal; color:${C.ink}; margin:0 0 18px;">${html}</h1>`;
}

/** Paragraphe de corps de texte. Accepte du HTML simple. */
export function emailParagraph(html: string): string {
  return `<p style="font-family:${SANS}; font-size:15px; line-height:1.7; color:${C.body}; margin:0 0 16px;">${html}</p>`;
}

/** Bouton d'action doré. */
export function emailButton(href: string, label: string): string {
  return `<a href="${href}" class="emm-btn" style="display:inline-block; background-color:${C.gold}; background-image:linear-gradient(135deg, ${C.goldLight} 0%, ${C.gold} 55%, ${C.goldDark} 100%); color:#ffffff; font-family:${SANS}; font-size:12px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; padding:15px 34px; border-radius:10px;">${label}</a>`;
}

/** Encadré crème avec liseré doré à gauche (adresse, note, etc.). */
export function emailInfoBox(innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
    <tr><td style="background:${C.softCream}; border-left:3px solid ${C.gold}; border-radius:6px; padding:18px 20px;">${innerHtml}</td></tr>
  </table>`;
}

/** Filet de séparation fin. */
export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${C.hairline}; font-size:0; line-height:0; height:0;">&nbsp;</td></tr></table>`;
}

/** Enveloppe complète : en-tête doré, carte blanche, pied de page. */
export function emailShell({
  title,
  preheader,
  content,
}: {
  title: string;
  preheader?: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${esc(title)}</title>
<style>
  body { margin:0; padding:0; width:100% !important; background:${C.cream}; }
  img { border:0; line-height:100%; outline:none; text-decoration:none; }
  @media only screen and (max-width:620px) {
    .emm-card-pad { padding:30px 22px 26px !important; }
    .emm-h1 { font-size:23px !important; }
    .emm-btn { display:block !important; text-align:center !important; padding-left:0 !important; padding-right:0 !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:${C.cream};">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0; color:transparent;">${esc(preheader || "")}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};">
    <tr><td align="center" style="padding:34px 16px 42px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">
        <tr><td align="center" style="padding:2px 0 26px;">
          <p style="font-family:${SERIF}; font-size:12px; letter-spacing:0.5em; text-transform:uppercase; color:${C.gold}; margin:0;">${SHOP_NAME}</p>
        </td></tr>
        <tr><td style="background:${C.white}; border:1px solid ${C.border}; border-radius:16px; overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height:4px; line-height:4px; font-size:0; background-color:${C.gold}; background-image:linear-gradient(90deg, ${C.goldLight}, ${C.gold} 50%, ${C.goldDark});">&nbsp;</td></tr>
            <tr><td class="emm-card-pad" style="padding:44px 44px 38px;">
              ${content}
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:30px 24px 6px;">
          <p style="font-family:${SERIF}; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:${C.gold}; margin:0 0 8px;">${SHOP_NAME}</p>
          <p style="font-family:${SANS}; font-size:12px; color:${C.muted}; margin:0;">${SHOP_TAGLINE}</p>
          <p style="font-family:${SANS}; font-size:11px; color:${C.muted}; margin:10px 0 0;">© ${new Date().getFullYear()} ${SHOP_NAME}. Tous droits réservés.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
