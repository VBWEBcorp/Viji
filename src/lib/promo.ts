import PromoCode, { type IPromoCode } from "@/models/PromoCode";

/**
 * Règle unique d'un code promo, partagée par tous les canaux payants du site :
 * boutique (kits), traiteur à emporter et ateliers. La demande de devis
 * événementiel s'en sert aussi, pour vérifier le code avant de le transmettre.
 *
 * Un même code (ex. une carte glissée dans les kits de Noël) vaut donc partout.
 */

export type PromoTrouve = { ok: true; promo: IPromoCode; discount: number };
export type PromoRefuse = { ok: false; error: string };

/** Remise en centimes pour un sous-total donné. Jamais plus que le sous-total. */
export function calculeRemise(
  promo: Pick<IPromoCode, "type" | "value">,
  subtotal: number
): number {
  let discount = 0;
  if (promo.type === "percentage") {
    discount = Math.round(subtotal * (promo.value / 100));
  } else if (promo.type === "fixed") {
    discount = promo.value;
  }
  // « Livraison offerte » et « X achetés, Y offerts » n'ont de sens que dans
  // la boutique : ailleurs, ils ne retirent rien du montant.
  return Math.max(0, Math.min(discount, subtotal));
}

/**
 * Cherche un code actif et en cours de validité, et calcule la remise.
 * `subtotal` à null : on vérifie seulement que le code existe et vit encore
 * (demande de devis, montant inconnu à ce stade).
 */
export async function resoutPromo(
  code: string,
  subtotal: number | null
): Promise<PromoTrouve | PromoRefuse> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, error: "Code promo requis" };

  const now = new Date();
  const promo = await PromoCode.findOne({
    code: clean,
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  });

  if (!promo) return { ok: false, error: "Code promo invalide ou expiré" };

  if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return {
      ok: false,
      error: "Ce code promo a atteint son nombre maximum d'utilisations",
    };
  }

  if (subtotal === null) return { ok: true, promo, discount: 0 };

  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
    return {
      ok: false,
      error: `Ce code s'applique à partir de ${(promo.minOrderAmount / 100)
        .toFixed(2)
        .replace(".", ",")} €`,
    };
  }

  return { ok: true, promo, discount: calculeRemise(promo, subtotal) };
}

/** Libellé court d'une remise, pour l'écran et les emails (ex. « -10 % »). */
export function libelleRemise(
  promo: Pick<IPromoCode, "type" | "value">
): string {
  if (promo.type === "percentage") return `-${promo.value} %`;
  if (promo.type === "fixed")
    return `-${(promo.value / 100).toFixed(2).replace(".", ",")} €`;
  if (promo.type === "free_shipping") return "livraison offerte";
  return "offre spéciale";
}

/**
 * Relit la remise gravée dans un paiement Stripe à sa création. Ces
 * métadonnées sont posées par le serveur : le navigateur ne peut pas les
 * modifier avec la clé publique.
 */
export function remiseDuPaiement(
  metadata: Record<string, string> | null | undefined
): { promoCode: string; discount: number } {
  const promoCode = metadata?.promoCode || "";
  const discount = Number.parseInt(metadata?.promoDiscount || "0", 10);
  if (!promoCode || !Number.isFinite(discount) || discount < 0) {
    return { promoCode: "", discount: 0 };
  }
  return { promoCode, discount };
}

/** Compte une utilisation du code, une fois le paiement confirmé. */
export async function compteUtilisation(code: string): Promise<void> {
  await PromoCode.updateOne(
    { code: code.trim().toUpperCase() },
    { $inc: { currentUses: 1 } }
  );
}
