/**
 * Click & Collect sur les kits.
 *
 * Le prix affiché d'un kit comprend la livraison en point relais. Quand le
 * client choisit le retrait à Vern-sur-Seiche, ce montant est déduit du prix
 * unitaire. Le montant se règle dans l'admin (Réglages → Livraison,
 * `shipping.clickCollectDiscount`, en centimes) ; absent, 5 €.
 *
 * Une seule logique pour la fiche kit, le panier, le paiement et la commande :
 * le serveur reste l'autorité, l'affichage ne fait que la reprendre.
 */

export const VARIANTE_CLICK_COLLECT = "Click & Collect";
export const REMISE_CLICK_COLLECT_DEFAUT = 500;

export function remiseClickCollect(shipping?: { clickCollectDiscount?: number | null } | null): number {
  const v = shipping?.clickCollectDiscount;
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : REMISE_CLICK_COLLECT_DEFAUT;
}

export function estClickCollect(variant?: string | null): boolean {
  return variant === VARIANTE_CLICK_COLLECT;
}

/** Prix unitaire réellement payé, en centimes. Jamais négatif. */
export function prixUnitaire(price: number, variant: string | null | undefined, remise: number): number {
  return estClickCollect(variant) ? Math.max(0, price - remise) : price;
}

/** Toute la commande est retirée sur place : ni point relais ni frais de port. */
export function toutEnClickCollect(items: { variant?: string | null }[]): boolean {
  return items.length > 0 && items.every((i) => estClickCollect(i.variant));
}

/**
 * Lieu de retrait en Click & Collect. Par défaut Vern-sur-Seiche ; certains
 * produits se retirent ailleurs (Viji, 19/11/2026 : l'Asian food box chez
 * TALLAT). Clé = slug du produit.
 */
export const LIEU_RETRAIT_DEFAUT = "Vern-sur-Seiche";
export const LIEUX_RETRAIT_PAR_PRODUIT: Record<string, string> = {
  "asian-food-box": "TALLAT épicerie asiatique, 55 Rue du Manoir de Servigné, 35132 Rennes",
};

export function lieuRetrait(slug?: string | null): string {
  return (slug && LIEUX_RETRAIT_PAR_PRODUIT[slug]) || LIEU_RETRAIT_DEFAUT;
}

/** « Retrait à Vern-sur-Seiche » ou « Retrait chez TALLAT épicerie asiatique, … ». */
export function phraseRetrait(lieu?: string | null): string {
  const l = lieu || LIEU_RETRAIT_DEFAUT;
  return l === LIEU_RETRAIT_DEFAUT ? `Retrait à ${l}` : `Retrait chez ${l}`;
}

/**
 * Lieux de retrait d'une commande, en lignes de texte simple. Un seul lieu :
 * une ligne « Retrait à … ». Plusieurs : une ligne par lieu, avec les articles.
 */
export function lignesRetrait(items: { name: string; variant?: string | null; lieuRetrait?: string | null }[]): string[] {
  const parLieu = new Map<string, string[]>();
  for (const i of items) {
    if (!estClickCollect(i.variant)) continue;
    const l = i.lieuRetrait || LIEU_RETRAIT_DEFAUT;
    parLieu.set(l, [...(parLieu.get(l) || []), i.name]);
  }
  if (parLieu.size === 0) return [phraseRetrait(LIEU_RETRAIT_DEFAUT)];
  if (parLieu.size === 1) return [phraseRetrait([...parLieu.keys()][0])];
  return [...parLieu.entries()].map(([l, noms]) => `${noms.join(", ")} : ${phraseRetrait(l).replace(/^R/, "r")}`);
}
