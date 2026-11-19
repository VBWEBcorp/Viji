import Image from "next/image";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import SiteSettings from "@/models/SiteSettings";
import { remiseClickCollect } from "@/lib/click-collect";
import { FILTRE_BOX_EN_AVANT, blocsDescription } from "@/lib/box-en-avant";
import AddToCartButton from "../../kits/[slug]/AddToCartButton";
import KitGallery from "../../kits/[slug]/KitGallery";

// Page dédiée d'une box mise en avant sur l'accueil. Relit le produit à chaque
// visite : les modifications faites dans l'admin (Produits) apparaissent tout de suite.
export const dynamic = "force-dynamic";

async function charger(slug: string) {
  await connectDB();
  return Product.findOne({ slug, ...FILTRE_BOX_EN_AVANT }).lean();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await charger(slug).catch(() => null);
  if (!p) return {};
  return {
    title: p.seo?.metaTitle?.trim() || p.name,
    description: p.seo?.metaDescription?.trim() || p.shortDescription || undefined,
  };
}

export default async function BoxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await charger(slug);
  if (!p) notFound();

  const settings = await SiteSettings.findOne().select("shipping").lean();
  const remiseCC = remiseClickCollect(settings?.shipping);

  const images = [...(p.images || [])]
    .filter((img) => img?.url)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((img) => ({ url: img.url, alt: img.alt || p.name }));
  const mention = p.tags?.[0] || "";
  const contenu = p.tags?.[1] || "";
  const blocs = blocsDescription(p.description);

  return (
    <div className="bg-white">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 md:pt-16 pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="relative aspect-[4/5] bg-[var(--brand-cream)] overflow-hidden">
            {images.length > 1 && <KitGallery images={images} name={p.name} />}
            {images.length === 1 && (
              <Image
                src={images[0].url}
                alt={images[0].alt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>

          <div className="flex flex-col">
            {mention && (
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--brand-gold)] mb-4">
                {mention}
              </p>
            )}
            <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05] mb-5">
              {p.name}
            </h1>
            {p.shortDescription && (
              <p className="text-[14px] text-gray-600 leading-relaxed mb-4">{p.shortDescription}</p>
            )}
            {contenu && (
              <p className="text-[11.5px] uppercase tracking-[0.12em] text-gray-400 mb-6 whitespace-pre-line">
                {contenu}
              </p>
            )}
            <AddToCartButton
              remiseClickCollect={remiseCC}
              product={{
                _id: String(p._id),
                name: p.name,
                slug: p.slug,
                price: p.price,
                image: images[0]?.url,
                lieuRetrait: p.lieuRetrait || "",
              }}
            />
          </div>
        </div>
      </section>

      {blocs.length > 0 && (
        <section className="bg-[var(--brand-cream)]/50 py-12 md:py-16">
          <div
            className={`max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 gap-8 md:gap-10 ${
              blocs.length >= 3 ? "md:grid-cols-3" : blocs.length === 2 ? "md:grid-cols-2" : ""
            }`}
          >
            {blocs.map((html, i) => (
              <div
                key={i}
                className="space-y-3 text-[13.5px] text-gray-600 leading-relaxed break-words [&_a]:text-[var(--brand-gold)] [&_a]:underline [&_h3]:font-serif [&_h3]:text-[15px] [&_h3]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
