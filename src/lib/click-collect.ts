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
