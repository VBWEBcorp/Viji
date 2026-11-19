// Box mise en avant (Viji, 19/11/2026) : présentée sur l'accueil au-dessus des
// « Trois formules », avec sa propre page /box/<slug>, et retirée de la grille
// de sa catégorie de kits.
import { descriptionEnHtml } from "@/lib/description-kit";

export const BOX_EN_AVANT = ["asian-food-box"];

/**
 * Description complète découpée en blocs pour l'affichage en colonnes : un bloc
 * commence à chaque ligne qui débute par « * » (une présentation par créatrice).
 * Sans « * », un seul bloc.
 */
export function blocsDescription(description: string | undefined | null): string[] {
  const d = (description || "").trim();
  if (!d) return [];
  if (/^\s*</.test(d)) return [descriptionEnHtml(d)];
  const blocs: string[] = [];
  let courant: string[] = [];
  for (const ligne of d.split(/\r?\n/)) {
    if (/^\s*\*/.test(ligne) && courant.join("").trim()) {
      blocs.push(courant.join("\n"));
      courant = [];
    }
    courant.push(ligne.replace(/^\s*\*\s*/, ""));
  }
  if (courant.join("").trim()) blocs.push(courant.join("\n"));
  return blocs.map((b) => descriptionEnHtml(b)).filter(Boolean);
}
