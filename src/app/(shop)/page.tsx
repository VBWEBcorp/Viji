import Link from "next/link";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SiteSettings from "@/models/SiteSettings";
import { ArrowRight, ArrowUpRight, Truck, ShieldCheck, RotateCcw, Star, Sparkles } from "lucide-react";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/shop/JsonLd";
import HomeClient from "./HomeClient";
import { getContents, c } from "@/lib/content";

export default async function HomePage() {
  await connectDB();

  const settings = await SiteSettings.findOne().lean();

  const cms = await getContents([
    "homepage_hero_badge",
    "homepage_hero_title_1",
    "homepage_hero_title_2",
    "homepage_hero_subtitle",
    "homepage_hero_cta_primary",
    "homepage_hero_cta_secondary",
    "homepage_hero_rating",
    "homepage_hero_clients",
    "homepage_hero_shipping",
    "homepage_featured_eyebrow",
    "homepage_featured_title",
    "homepage_latest_eyebrow",
    "homepage_latest_title",
    "homepage_trust_eyebrow",
    "homepage_trust_title",
    "homepage_trust_1_title",
    "homepage_trust_1_desc",
    "homepage_trust_2_title",
    "homepage_trust_2_desc",
    "homepage_trust_3_title",
    "homepage_trust_3_desc",
    "homepage_trust_4_title",
    "homepage_trust_4_desc",
    "homepage_marquee_text",
  ]);

  const [featuredProducts, latestProducts, allProducts, categories] = await Promise.all([
    Product.find({ isActive: true, isFeatured: true })
      .populate("category", "name slug")
      .limit(12)
      .lean(),
    Product.find({ isActive: true })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
    Product.find({ isActive: true })
      .select("name slug price images")
      .sort({ createdAt: -1 })
      .limit(16)
      .lean(),
    Category.find({ isActive: true })
      .sort({ order: 1 })
      .limit(8)
      .lean(),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";

  // Serialize Mongoose objects to plain JSON for client components
  function serializeProduct(p: (typeof featuredProducts)[0]) {
    const cat = p.category as unknown as { name: string; slug: string } | null;
    return {
      _id: String(p._id),
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice || undefined,
      images: (p.images || []).map((img) => ({ url: img.url, alt: img.alt || "", order: img.order || 0 })),
      category: cat ? { name: cat.name, slug: cat.slug } : undefined,
    };
  }

  const serialized = {
    featured: featuredProducts.map(serializeProduct),
    latest: latestProducts.map(serializeProduct),
    marqueeImages: allProducts
      .filter((p) => p.images?.length > 0)
      .map((p) => ({
        url: p.images[0].url,
        alt: p.images[0].alt || p.name,
        name: p.name,
        price: p.price,
      })),
    categories: categories.map((c) => ({
      _id: String(c._id),
      name: c.name,
      slug: c.slug,
      image: c.image || undefined,
    })),
  };

  return (
    <div>
      <OrganizationJsonLd
        name={settings?.shopName || "Ma Boutique"}
        url={baseUrl}
        logo={settings?.shopLogo || undefined}
        description={settings?.shopDescription || undefined}
        email={settings?.contactEmail || undefined}
        phone={settings?.contactPhone || undefined}
        address={settings?.address || undefined}
        social={settings?.social}
      />
      <WebSiteJsonLd name={settings?.shopName || "Ma Boutique"} url={baseUrl} />

      {/* ══════════════════════════════════════════
          1. HERO — Full screen, typo massive
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute top-[-30%] left-[10%] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[400px] h-[400px] bg-sky-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white text-[12px] font-medium px-4 py-1.5 rounded-full mb-8">
            <Sparkles size={12} className="text-amber-400" />
            {c(cms, "homepage_hero_badge", "Nouvelle collection disponible")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-gray-900 leading-[0.95]">
            {c(cms, "homepage_hero_title_1", "Des produits")}
            <br />
            <span className="bg-gradient-to-r from-gray-900 via-gray-500 to-gray-300 bg-clip-text text-transparent">
              {c(cms, "homepage_hero_title_2", "d'exception")}
            </span>
          </h1>

          <p className="mt-7 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
            {c(cms, "homepage_hero_subtitle", "Qualite premium, livraison express, retours gratuits. Votre satisfaction est notre priorite.")}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2.5 bg-gray-900 text-white px-8 py-4 rounded-2xl font-semibold text-[15px] hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              {c(cms, "homepage_hero_cta_primary", "Voir le catalogue")}
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-500 px-6 py-4 rounded-2xl font-medium text-[15px] hover:text-gray-900 transition-colors"
            >
              {c(cms, "homepage_hero_cta_secondary", "Lire le blog")} <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="mt-14 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}</div>
              <span>{c(cms, "homepage_hero_rating", "4.9/5")}</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <span>{c(cms, "homepage_hero_clients", "+2 000 clients")}</span>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <span className="hidden sm:block">{c(cms, "homepage_hero_shipping", "Livraison gratuite des 50€")}</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2-4. CLIENT SECTIONS (carousel, products, categories)
      ══════════════════════════════════════════ */}
      <HomeClient
        marqueeImages={serialized.marqueeImages}
        featured={serialized.featured}
        latest={serialized.latest}
        categories={serialized.categories}
        labels={{
          featuredEyebrow: c(cms, "homepage_featured_eyebrow", "Selection"),
          featuredTitle: c(cms, "homepage_featured_title", "Nos coups de coeur"),
          latestEyebrow: c(cms, "homepage_latest_eyebrow", "Fraichement ajoutes"),
          latestTitle: c(cms, "homepage_latest_title", "Nouveautes"),
        }}
      />

      {/* ══════════════════════════════════════════
          5. TRUST — Bento features
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{c(cms, "homepage_trust_eyebrow", "Pourquoi nous ?")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {c(cms, "homepage_trust_title", "L'experience qui fait la difference")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: c(cms, "homepage_trust_1_title", "Expedition express"), desc: c(cms, "homepage_trust_1_desc", "Commandez avant 14h, livraison sous 24-48h."), accent: "bg-blue-50 text-blue-600" },
            { icon: ShieldCheck, title: c(cms, "homepage_trust_2_title", "Paiement securise"), desc: c(cms, "homepage_trust_2_desc", "Stripe, PayPal, CB. Donnees chiffrees."), accent: "bg-emerald-50 text-emerald-600" },
            { icon: RotateCcw, title: c(cms, "homepage_trust_3_title", "Retours gratuits"), desc: c(cms, "homepage_trust_3_desc", "14 jours pour changer d'avis. Sans condition."), accent: "bg-violet-50 text-violet-600" },
            { icon: Star, title: c(cms, "homepage_trust_4_title", "Qualite premium"), desc: c(cms, "homepage_trust_4_desc", "Chaque produit est selectionne et teste."), accent: "bg-amber-50 text-amber-600" },
          ].map((item) => (
            <div key={item.title} className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300">
              <div className={`w-11 h-11 rounded-xl ${item.accent} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon size={20} />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. MARQUEE TEXT
      ══════════════════════════════════════════ */}
      <section className="border-y border-gray-100 py-5 overflow-hidden">
        <div className="animate-marquee flex items-center gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, r) => {
            const items = c(cms, "homepage_marquee_text", "Livraison express|Paiement securise|Retours gratuits|Support 7j/7|Qualite premium|Satisfait ou rembourse")
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean);
            return (
              <div key={r} className="flex items-center gap-10">
                {[...items, ...items].map((t, i) => (
                  <span key={`${r}-${i}`} className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />{t}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </section>


      {/* Empty */}
      {featuredProducts.length === 0 && latestProducts.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-32 text-center">
          <p className="text-gray-400 text-lg">Aucun produit pour le moment.</p>
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 mt-6 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition">
            Ajouter un produit <ArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
