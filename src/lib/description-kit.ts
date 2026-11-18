// Description complète d'un kit, saisie dans l'admin (Produits → Description complète).
// Deux formats coexistent en base : du HTML (anciens kits) et du texte simple (saisi par la
// commerçante). Le texte simple est échappé, découpé en paragraphes, et ses adresses de sites
// (umikan.fr, https://…) et comptes Instagram (@compte) deviennent des liens cliquables.

function echapper(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const FIN = "[^\\s<.,;:!?)\\]]";
const LIENS = new RegExp(
  [
    // 1. adresse complète
    `(https?:\\/\\/[^\\s<]*${FIN})`,
    // 2. domaine nu : umikan.fr, www.instagram.com/compte
    `((?<![\\w@.\\/-])(?:www\\.)?[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:fr|com|net|org|be|ch|eu|io|co)(?:\\/[^\\s<]*${FIN})?(?![\\w@-]))`,
    // 3. compte Instagram : @compte (jamais une adresse mail, qui a du texte avant le @)
    `((?<![\\w.@])@([A-Za-z0-9._]*[A-Za-z0-9_]))`,
  ].join("|"),
  "gi",
);

function lien(href: string, texte: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${texte}</a>`;
}

export function rendreLiens(texteEchappe: string): string {
  return texteEchappe.replace(LIENS, (m, url, domaine, insta, compte) => {
    if (url) return lien(url, url);
    if (domaine) return lien(`https://${domaine}`, domaine);
    if (insta) return lien(`https://www.instagram.com/${compte}/`, insta);
    return m;
  });
}

export function estHtml(description: string): boolean {
  return /^\s*</.test(description);
}

/** HTML prêt à afficher, ou "" si la description est vide. */
export function descriptionEnHtml(description: string | undefined | null): string {
  const d = (description || "").trim();
  if (!d) return "";
  if (estHtml(d)) return d;
  return d
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${rendreLiens(echapper(p)).replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}
