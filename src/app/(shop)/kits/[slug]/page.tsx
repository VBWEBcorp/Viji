import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Snowflake, BookOpen, Sprout, Sparkles, Star } from "lucide-react";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import AddToCartButton from "./AddToCartButton";

const VALID_SLUGS = ["decouverte", "signature", "familiale"];

const KITS = [
  { slug: "decouverte", label: "Découverte", tagline: "L'initiation" },
  { slug: "signature", label: "Signature", tagline: "Le plat complet" },
  { slug: "familiale", label: "Familiale", tagline: "Le festin partagé" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const titles: Record<string, string> = {
    decouverte: "Kit Découverte",
    signature: "Kit Signature",
    familiale: "Kit Familiale",
  };
  return {
    title: titles[slug] || "Kit",
    description:
      "Kits culinaires indiens à faire soi-même, épices sélectionnées, recettes pas à pas.",
  };
}

function formatEUR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export default async function KitCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  await connectDB();

  const cat = await Category.findOne({ slug, isActive: true }).lean();
  if (!cat) notFound();

  const products = await Product.find({ category: cat._id, isActive: true })
    .sort({ isFeatured: -1, createdAt: 1 })
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
    isFeatured: !!p.isFeatured,
  }));

  return (
    <div className="bg-white">
      {/* ── HEADER + SWITCHER KITS ────────────────────────────── */}
      <header className="border-b border-[var(--brand-gold)]/20 pt-12 md:pt-16 pb-0">
        <div className="text-center px-4 mb-8 md:mb-10">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
            Kits à faire soi-même
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
            {cat.name}
          </h1>
        </div>

        {/* Tabs : un onglet par kit, façon sélecteur de format */}
        <nav
          aria-label="Choisir un kit"
          className="max-w-3xl mx-auto px-4 sm:px-6"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-3 -mb-px">
            {KITS.map((k) => {
              const active = k.slug === slug;
              return (
                <Link
                  key={k.slug}
                  href={`/kits/${k.slug}`}
                  className={`relative flex flex-col items-center text-center py-3 sm:py-4 px-2 border-x border-t transition ${
                    active
                      ? "bg-[var(--brand-cream)] border-[var(--brand-gold)]/40 text-[var(--brand-gold)]"
                      : "bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.3em] mb-0.5">
                    {k.tagline}
                  </span>
                  <span className="font-serif text-base sm:text-lg leading-tight">
                    {k.label}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-2 right-2 -bottom-px h-px bg-[var(--brand-cream)]"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* ── BANDEAU RÉASSURANCE ───────────────────────────────── */}
      <section
        aria-label="Garanties"
        className="bg-[var(--brand-cream)]/60 border-b border-[var(--brand-gold)]/15 py-5 md:py-6"
      >
        <ul className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 text-center">
          <Reassure
            Icon={Sprout}
            title="Épices fraîches"
            sub="Sélection rigoureuse, en petites quantités"
          />
          <Reassure
            Icon={BookOpen}
            title="Recettes pas-à-pas"
            sub="Faciles à suivre, même débutant"
          />
          <Reassure
            Icon={Snowflake}
            title="Mondial Relay & retrait"
            sub="Livraison en point relais ou Click & Collect"
          />
          <Reassure
            Icon={Sparkles}
            title="Ateliers possibles"
            sub="Apprenez les techniques en direct"
          />
        </ul>
      </section>

      {/* ── GRILLE DE CARTES ──────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        {items.length === 0 && (
          <p className="text-center text-gray-500 py-20">
            Aucun produit pour le moment.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item) => {
            return (
              <article
                key={item._id}
                className="group flex flex-col bg-white border border-gray-100 hover:border-[var(--brand-gold)]/30 transition-colors duration-300 overflow-hidden"
              >
                {/* Visuel + badges */}
                <div className="relative aspect-[4/5] bg-[var(--brand-cream)] overflow-hidden">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}

                  {item.servings && (
                    <span className="absolute bottom-3 left-3 inline-block bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] uppercase tracking-[0.18em] font-medium px-2.5 py-1">
                      {item.servings}
                    </span>
                  )}
                </div>

                {/* Contenu */}
                <div className="flex flex-col flex-1 p-5 md:p-6">
                  <h2 className="font-serif text-xl md:text-[22px] text-gray-900 leading-tight mb-2.5">
                    {item.name}
                  </h2>

                  <p className="text-[13px] text-gray-600 leading-relaxed mb-3 line-clamp-2">
                    {item.shortDescription}
                  </p>

                  {item.contents && (
                    <p className="text-[11.5px] uppercase tracking-[0.12em] text-gray-400 mb-4">
                      {item.contents}
                    </p>
                  )}

                  {/* Bloc prix */}
                  <div className="flex items-baseline gap-3 mb-5 mt-auto">
                    <p className="text-2xl font-serif text-gray-900">
                      {formatEUR(item.price)}
                    </p>
                  </div>

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
            );
          })}
        </div>

        {/* Mini note d'avis */}
        <div className="flex items-center justify-center gap-2 mt-12 md:mt-14 text-gray-500">
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
            ))}
          </span>
          <span className="text-[12px]">5,0 · 18 avis Google</span>
        </div>
      </div>
    </div>
  );
}

function Reassure({
  Icon,
  title,
  sub,
}: {
  Icon: typeof Snowflake;
  title: string;
  sub: string;
}) {
  return (
    <li className="flex flex-col items-center gap-1.5">
      <Icon size={20} strokeWidth={1.5} className="text-[var(--brand-gold)]" />
      <p className="text-[12px] sm:text-[13px] font-medium text-gray-900 leading-tight">
        {title}
      </p>
      <p className="text-[11px] text-gray-500 leading-snug max-w-[18ch]">{sub}</p>
    </li>
  );
}
