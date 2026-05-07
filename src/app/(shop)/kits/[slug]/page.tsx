import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import AddToCartButton from "./AddToCartButton";

const VALID_SLUGS = ["decouverte", "signature", "familiale"];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const titles: Record<string, string> = {
    decouverte: "Kit Découverte",
    signature: "Kit Signature",
    familiale: "Kit Familiale",
  };
  return {
    title: titles[slug] || "Kit",
    description: "Kits culinaires indiens à faire soi-même, épices sélectionnées, recettes pas à pas.",
  };
}

export default async function KitCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  await connectDB();

  const cat = await Category.findOne({ slug, isActive: true }).lean();
  if (!cat) notFound();

  const products = await Product.find({ category: cat._id, isActive: true })
    .sort({ createdAt: 1 })
    .lean();

  const items = products.map((p) => ({
    _id: String(p._id),
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription || "",
    price: p.price,
    image: p.images?.[0]?.url,
    imageAlt: p.images?.[0]?.alt || p.name,
    servings: p.tags?.[0] || "",
    contents: p.tags?.[1] || "",
  }));

  return (
    <div className="bg-white">
      {/* Page header */}
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16">
        <h1 className="font-serif text-4xl md:text-5xl text-center text-[var(--brand-gold)] uppercase tracking-wide">
          {cat.name}
        </h1>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16 md:space-y-20">
        {items.length === 0 && (
          <p className="text-center text-gray-500 py-20">Aucun produit pour le moment.</p>
        )}

        {items.map((item, idx) => (
          <article
            key={item._id}
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${
              idx > 0 ? "border-t border-gray-100 pt-16 md:pt-20" : ""
            }`}
          >
            <div className="block bg-[var(--brand-cream)] aspect-[4/5] relative overflow-hidden">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
            </div>

            <div>
              {item.servings && (
                <span className="inline-block bg-[var(--brand-olive)] text-white text-[12px] uppercase tracking-wider px-4 py-1.5 rounded-sm mb-5">
                  {item.servings}
                </span>
              )}

              <h2 className="font-serif text-3xl md:text-4xl text-[var(--brand-gold)] uppercase mb-5 leading-tight">
                {item.name}
              </h2>

              <div className="w-10 h-px bg-[var(--brand-gold)] mb-5" />

              <p className="text-[14px] text-gray-700 leading-relaxed mb-5 max-w-md">
                {item.shortDescription}
              </p>

              {item.contents && (
                <p className="text-[14px] text-gray-600 mb-6">{item.contents}.</p>
              )}

              <p className="text-2xl text-gray-900 mb-6">
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
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
