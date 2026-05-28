import AtelierSession from "@/models/AtelierSession";
import Product from "@/models/Product";

// Atelier à domicile : pas de session datée, le prix vient du produit dédié
// (avec repli sur le tarif par défaut affiché côté page).
const AT_HOME_ATELIER_SLUG = "atelier-a-domicile";
const AT_HOME_PRODUCT_SLUG = "atelier-cuisine-indienne";
const AT_HOME_DEFAULT_PRICE = 6000;

/**
 * Résout le prix unitaire (par personne, en centimes) d'un atelier à partir de
 * son slug. Source de vérité côté serveur : on ne fait jamais confiance à un
 * prix envoyé par le client.
 * - atelier collectif → prix de la session en base
 * - atelier à domicile → prix du produit dédié (repli sur le tarif par défaut)
 * Retourne `null` si le slug ne correspond à aucun atelier connu.
 * Suppose une connexion DB déjà établie (connectDB appelé par l'appelant).
 */
export async function resolveAtelierUnitPrice(sessionSlug: string): Promise<number | null> {
  const session = await AtelierSession.findOne({ slug: sessionSlug, isActive: true })
    .select("price")
    .lean();
  if (session) return session.price;

  if (sessionSlug === AT_HOME_ATELIER_SLUG) {
    const product = await Product.findOne({ slug: AT_HOME_PRODUCT_SLUG, isActive: true })
      .select("price")
      .lean();
    return product?.price ?? AT_HOME_DEFAULT_PRICE;
  }

  return null;
}
