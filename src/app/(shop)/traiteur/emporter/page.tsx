import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import AddToCartButton from "../../kits/[slug]/AddToCartButton";

export const metadata = {
  title: "Traiteur à emporter",
  description:
    "Plats indiens à emporter en click & collect. Menu hebdomadaire, cuisine maison.",
};

export default async function TraiteurEmporterPage() {
  let items: {
    _id: string;
    name: string;
    slug: string;
    shortDescription: string;
    price: number;
    image?: string;
    servings?: string;
    contents?: string;
  }[] = [];

  try {
    await connectDB();
    const cat = await Category.findOne({ slug: "traiteur", isActive: true }).lean();
    if (cat) {
      const products = await Product.find({ category: cat._id, isActive: true })
        .sort({ createdAt: 1 })
        .lean();
      items = products.map((p) => ({
        _id: String(p._id),
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription || "",
        price: p.price,
        image: p.images?.[0]?.url,
        servings: p.tags?.[0],
        contents: p.tags?.[1],
      }));
    }
  } catch {
    // ignore
  }

  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">Traiteur</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          À emporter
        </h1>
        <p className="mt-5 text-[13px] text-gray-600 max-w-md mx-auto">
          Click & Collect : commandez en ligne, retirez à Melesse.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-20">Menu en cours de mise à jour.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {items.map((item) => (
              <article key={item._id} className="group">
                <div className="block relative aspect-[4/5] overflow-hidden bg-[var(--brand-cream)] mb-5">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                </div>

                {item.servings && (
                  <span className="inline-block bg-[var(--brand-olive)] text-white text-[11px] uppercase tracking-wider px-3 py-1 rounded-sm mb-3">
                    {item.servings}
                  </span>
                )}

                <h2 className="font-serif text-xl text-[var(--brand-gold)] mb-2 leading-tight">
                  {item.name}
                </h2>

                <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                  {item.shortDescription}
                </p>

                <p className="text-lg text-gray-900 mb-4">
                  {(item.price / 100).toFixed(2).replace(".", ",")} €
                </p>

                <AddToCartButton
                  product={{
                    _id: item._id,
                    name: item.name,
                    slug: item.slug,
                    price: item.price,
                    image: item.image,
                  }}
                  methods={["click-collect"]}
                />
              </article>
            ))}
          </div>
        )}

        <div className="mt-16 pt-12 border-t border-gray-100 text-center">
          <p className="text-[13px] text-gray-600 mb-2">Vous organisez un événement&nbsp;?</p>
          <Link
            href="/traiteur/evenementiel"
            className="inline-flex items-center gap-2 text-[var(--brand-gold)] uppercase tracking-widest text-[12px] font-medium hover:text-[var(--brand-gold-dark)] transition"
          >
            Voir le traiteur événementiel →
          </Link>
        </div>
      </div>
    </div>
  );
}
