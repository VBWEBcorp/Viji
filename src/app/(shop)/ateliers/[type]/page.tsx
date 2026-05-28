import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import AtelierForm from "../AtelierForm";
import YouTubeShort from "@/components/shop/YouTubeShort";

type AtelierConfig = {
  title: string;
  eyebrow: string;
  intro: string;
  image: string;
  videoId?: string;
  program: { title: string; body: string }[];
  practical: { label: string; value: string }[];
  defaultPrice: number;
};

const TYPES: Record<string, AtelierConfig> = {
  "a-domicile": {
    title: "Atelier à domicile",
    eyebrow: "Atelier",
    intro:
      "Je viens chez vous avec ingrédients, épices, matériel et tablier. Tout est prêt, vous n'avez qu'à profiter.",
    image: "https://i.ibb.co/qLvzCsJS/Viji.jpg",
    videoId: "mBXvjsEqAZw",
    program: [
      { title: "Une expérience conviviale chez vous", body: "Je me déplace avec ingrédients, épices, matériel et tablier. Vous n'avez à rien prévoir." },
      { title: "Menu", body: "Poulet aux pommes de terre, riz au citron, raita oignon, lassi salé. Adapté à votre groupe." },
      { title: "Au programme", body: "Apprentissage des épices essentielles, préparation pas à pas, cuisson lente et astuces pour reproduire." },
      { title: "Convivialité", body: "Dégustation du repas ensemble dans votre cuisine. Échange et transmission." },
      { title: "Enfants", body: "Participation gratuite jusqu'à 6 ans." },
      { title: "Adaptations", body: "Allergies et restrictions à préciser à la réservation." },
    ],
    practical: [
      { label: "Format", value: "Petit groupe (jusqu'à 6 personnes)" },
      { label: "Durée", value: "Environ 2h30" },
      { label: "Lieu", value: "Chez vous (Rennes et alentours)" },
    ],
    defaultPrice: 6000,
  },
  // "collectif" est désormais géré par /ateliers/collectif (liste de
  // sessions individuelles), il n'est plus une route [type] dynamique.
  "chef-prive": {
    title: "Cheffe privée à domicile",
    eyebrow: "Service",
    intro:
      "Vous recevez, je m'occupe de tout. Menu indien sur mesure, service complet, cuisine laissée propre.",
    image: "https://i.ibb.co/qLvzCsJS/Viji.jpg",
    videoId: "WcYWmnDoy6M",
    program: [
      { title: "Je cuisine pour vous", body: "Service traiteur à domicile : vous recevez, je m'occupe de tout en cuisine." },
      { title: "Menu personnalisé", body: "Nous définissons ensemble un menu indien adapté à vos goûts et à votre événement." },
      { title: "Service complet", body: "Approvisionnement, préparation, cuisson sur place, service. Cuisine laissée propre." },
      { title: "Pour quelle occasion", body: "Dîner entre amis, anniversaire, repas de famille, fête privée." },
      { title: "Adaptations", body: "Allergies, restrictions et préférences à préciser au moment du devis." },
    ],
    practical: [
      { label: "Format", value: "Sur devis selon menu et nombre de couverts" },
      { label: "Lieu", value: "Chez vous (Rennes et alentours)" },
      { label: "Réservation", value: "Sur demande" },
    ],
    defaultPrice: 0,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const data = TYPES[type];
  if (!data) return { title: "Atelier" };
  return {
    title: data.title,
    description: data.intro,
  };
}

export function generateStaticParams() {
  return Object.keys(TYPES).map((type) => ({ type }));
}

export default async function AtelierTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const data = TYPES[type];
  if (!data) notFound();

  let atelier: { _id: string; price: number } | null = null;
  try {
    await connectDB();
    const doc = await Product.findOne({ slug: "atelier-cuisine-indienne", isActive: true }).lean();
    if (doc) {
      atelier = { _id: String(doc._id), price: doc.price };
    }
  } catch {
    // ignore
  }

  const price = atelier?.price ?? data.defaultPrice;
  const isQuoteOnly = type === "chef-prive";
  const formattedPrice = `${(price / 100).toFixed(2).replace(".", ",")} €`;

  return (
    <div className="bg-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
            {data.eyebrow}
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-gray-900 leading-[1.05] mb-8">
            {data.title.split(" ").map((word, i, arr) => {
              const isLast = i === arr.length - 1;
              return (
                <span key={i}>
                  {isLast ? (
                    <span className="italic text-[var(--brand-gold)]">{word}</span>
                  ) : (
                    word
                  )}
                  {!isLast && " "}
                </span>
              );
            })}
          </h1>
          <div className="w-12 h-px bg-[var(--brand-gold)]/50 mx-auto mb-8" />
          <p className="font-serif italic text-[16px] md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {data.intro}
          </p>
        </div>
      </section>

      {/* ── VISUEL + PROGRAMME ───────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
          {/* Visuel */}
          <div className="md:col-span-5 md:sticky md:top-28">
            <div className="relative pl-6 sm:pl-8 pb-8 sm:pb-10">
              {/* Decorative gold offset frame */}
              <div className="absolute -bottom-2 right-2 sm:-bottom-3 sm:right-3 top-3 left-9 sm:top-4 sm:left-12 border border-[var(--brand-gold)]/40 pointer-events-none" />

              {data.videoId ? (
                <div className="relative">
                  <YouTubeShort
                    id={data.videoId}
                    title={`${data.title} · vidéo`}
                    className="shadow-xl shadow-black/15"
                  />
                </div>
              ) : (
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={data.image}
                    alt={data.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                    priority
                  />
                </div>
              )}
            </div>
          </div>

          {/* Programme */}
          <div className="md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">
              L&apos;expérience
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-[1.1] mb-3">
              Au{" "}
              <span className="italic text-[var(--brand-gold)]">programme</span>
            </h2>
            <div className="w-10 h-px bg-[var(--brand-gold)]/40 mb-10" />

            <div className="divide-y divide-[var(--brand-gold)]/15">
              {data.program.map((item) => (
                <div key={item.title} className="py-5 first:pt-0">
                  <h3 className="font-serif text-[18px] text-gray-900 leading-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-gray-600 leading-[1.75]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INFOS PRATIQUES ─────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">
              Infos pratiques
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-[1.05]">
              En un{" "}
              <span className="italic text-[var(--brand-gold)]">coup d&apos;œil</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {data.practical.map((row) => (
              <div
                key={row.label}
                className="bg-white border border-[var(--brand-gold)]/15 px-6 py-7 text-center"
              >
                <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-3">
                  {row.label}
                </p>
                <div className="w-6 h-px bg-[var(--brand-gold)]/40 mx-auto mb-4" />
                <p className="font-serif text-[16px] md:text-[17px] text-gray-900 leading-snug">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RÉSERVATION ─────────────────────────────────────── */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[var(--brand-gold)]/20 px-6 sm:px-10 py-10 md:py-12">
            <div className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-4">
                {isQuoteOnly ? "Tarification" : "Réserver"}
              </p>
              <h2 className="font-serif text-3xl md:text-4xl text-gray-900 leading-[1.05] mb-6">
                {isQuoteOnly ? (
                  <>
                    Sur{" "}
                    <span className="italic text-[var(--brand-gold)]">devis</span>
                  </>
                ) : (
                  <>
                    Votre{" "}
                    <span className="italic text-[var(--brand-gold)]">place</span>
                  </>
                )}
              </h2>
              <div className="w-10 h-px bg-[var(--brand-gold)]/40 mx-auto mb-7" />
              {!isQuoteOnly && (
                <p className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] mb-2">
                  {formattedPrice}
                </p>
              )}
              <p className="font-serif italic text-[13px] text-gray-500">
                {isQuoteOnly
                  ? "Devis personnalisé selon votre événement"
                  : "Par personne · matériel & ingrédients inclus"}
              </p>
            </div>

            {isQuoteOnly ? (
              <div className="text-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
                >
                  Demander un devis
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <AtelierForm
                productId={atelier?._id}
                productName={data.title}
                atelierSlug={`atelier-${type}`}
                price={price}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── CTA AUTRES ATELIERS ─────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
            Aller plus loin
          </p>
          <h2 className="font-serif text-2xl md:text-3xl text-gray-900 leading-tight mb-6">
            Découvrez nos{" "}
            <span className="italic text-[var(--brand-gold)]">autres formules</span>
          </h2>
          <Link
            href="/ateliers/collectif"
            className="inline-flex items-center gap-2 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
          >
            Voir les ateliers collectifs <ArrowRight size={11} />
          </Link>
        </div>
      </section>
    </div>
  );
}
