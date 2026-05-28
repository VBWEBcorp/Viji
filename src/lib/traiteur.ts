import Category from "@/models/Category";
import Product from "@/models/Product";

export type TraiteurItem = { id: string; quantity: number };
export type TraiteurLine = { name: string; quantity: number; unitPrice: number };

/**
 * Recalcule le montant total d'une commande traiteur à partir des plats en base
 * (catégorie « traiteur », actifs). On ne fait jamais confiance aux prix envoyés
 * par le client. Retourne `null` si un plat est introuvable / hors catégorie.
 * Suppose qu'une connexion DB est déjà établie (connectDB appelé par l'appelant).
 */
export async function computeTraiteurAmount(
  items: TraiteurItem[]
): Promise<{ amount: number; lines: TraiteurLine[] } | null> {
  const cat = await Category.findOne({ slug: "traiteur", isActive: true }).lean();
  if (!cat) return null;

  const ids = items.map((i) => i.id);
  const products = await Product.find({
    _id: { $in: ids },
    category: cat._id,
    isActive: true,
  }).lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  let amount = 0;
  const lines: TraiteurLine[] = [];
  for (const item of items) {
    const product = byId.get(item.id);
    if (!product) return null;
    amount += product.price * item.quantity;
    lines.push({ name: product.name, quantity: item.quantity, unitPrice: product.price });
  }
  return { amount, lines };
}
