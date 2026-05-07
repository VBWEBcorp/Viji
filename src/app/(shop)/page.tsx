import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import { ArrowRight, Star } from "lucide-react";
import YouTubeShort from "@/components/shop/YouTubeShort";
import HeroSection from "@/components/shop/HeroSection";
import ReviewMarquee from "@/components/shop/ReviewMarquee";

export const metadata = {
  title: "Entre Maman et Moi · Kits culinaires indiens & ateliers",
  description:
    "Voyagez au cœur de l'Inde depuis votre cuisine. Kits à faire soi-même, ateliers conviviaux et traiteur indien à Rennes.",
};

const KIT_TAGLINES: Record<string, string> = {
  decouverte: "L'initiation",
  signature: "Le plat complet",
  familiale: "Le festin partagé",
};

const REVIEWS = [
  { name: "Thierry", initial: "T", when: "il y a 2 mois", body: "Recommandé par des amis. Disponibilité, savoir-faire, excellente ambiance." },
  { name: "Julie", initial: "J", when: "il y a 3 mois", body: "Explications claires, étape par étape. Le riz au citron : une pure merveille." },
  { name: "Léna", initial: "L", when: "il y a 5 mois", body: "On sent l'authenticité et la passion. Le chutney mangue, une folie." },
];

// 6 images pour un pavage propre 4 colonnes × 2 rangées (2 grandes en bord, 4 carrées au centre)
const ATMOSPHERE = [
  { src: "https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg", alt: "Samoussas", className: "row-span-2" },
  { src: "https://i.ibb.co/Kx5rKtGN/Halwa.jpg", alt: "Halwa" },
  { src: "https://i.ibb.co/KcVCgbMz/Raita-oignon.jpg", alt: "Raïta oignon" },
  { src: "https://i.ibb.co/8LKgk2jg/Beef-lemon-rice.jpg", alt: "Bœuf riz au citron", className: "row-span-2" },
  { src: "https://i.ibb.co/HfXy27N9/Lassi-sucr.jpg", alt: "Lassi sucré" },
  { src: "https://i.ibb.co/F4318X0S/Ourka-citron.jpg", alt: "Ourka au citron" },
];

export default async function HomePage() {
  let categories: { name: string; slug: string; image?: string }[] = [];

  try {
    await connectDB();
    const cats = await Category.find({
      isActive: true,
      slug: { $in: ["decouverte", "signature", "familiale"] },
    })
      .sort({ order: 1 })
      .lean();
    categories = cats.map((d) => ({ name: d.name, slug: d.slug, image: d.image }));
  } catch {
    // ignore
  }

  if (categories.length === 0) categories = DEFAULT_KITS;

  return (
    <div className="bg-white">
      {/* ── HERO + BANDEAU INTERACTIF ──────────────────────────── */}
      <HeroSection images={ATMOSPHERE} />

      {/* ── 3 KITS — cartes monumentales ───────────────────────── */}
      <section className="py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
              Kits à faire soi-même
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05]">
              Trois <span className="italic text-[var(--brand-gold)]">formules</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-16">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/kits/${cat.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--brand-cream)] mb-6">
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-2">
                  {KIT_TAGLINES[cat.slug] || ""}
                </p>
                <h3 className="font-serif text-2xl md:text-3xl text-gray-900 mb-4 leading-tight">
                  {cat.name}
                </h3>
                <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  Découvrir <ArrowRight size={11} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOSAÏQUE PINTEREST ─────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/50 py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
              Atmosphère
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05] mb-6">
              <span className="italic text-[var(--brand-gold)]">L'Inde</span> dans l'assiette
            </h2>
            <p className="text-[14px] text-gray-600 leading-relaxed">
              Couleurs, parfums, gestes : un voyage sensoriel.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 auto-rows-[140px] md:auto-rows-[200px]">
            {ATMOSPHERE.map((img, i) => (
              <div
                key={i}
                className={`relative overflow-hidden group ${img.className || ""}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PULL QUOTE ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-32 md:py-44">
        {/* Decorative bowls — slow rotation + scroll-driven tilt */}
        <div className="pointer-events-none absolute -left-12 top-12 md:-left-20 md:top-24 w-40 h-40 md:w-56 md:h-56 opacity-25 scroll-roll">
          <div className="w-full h-full animate-spin-slow">
            <Image
              src="https://i.ibb.co/cKKfhCLf/Bol-seul.png"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 10rem, 14rem"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 bottom-10 md:-right-16 md:bottom-20 w-32 h-32 md:w-48 md:h-48 opacity-20 scroll-roll">
          <div className="w-full h-full animate-spin-slow-reverse">
            <Image
              src="https://i.ibb.co/cKKfhCLf/Bol-seul.png"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 8rem, 12rem"
            />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-12" />
          <p className="font-serif italic text-3xl md:text-5xl text-gray-900 leading-[1.25] mb-10">
            «&nbsp;L'Inde se cuisine<br />avec les <span className="text-[var(--brand-gold)]">mains</span>, les sens<br />et le cœur.&nbsp;»
          </p>
          <p className="font-serif italic text-xl text-[var(--brand-gold)]">Viji</p>
          <div className="mt-10">
            <Link
              href="/pages/a-propos"
              className="inline-flex items-center gap-2 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Découvrir plus <ArrowRight size={11} />
            </Link>
          </div>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mt-12" />
        </div>
      </section>

      {/* ── FULL-BLEED ATELIER ─────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh] bg-[var(--brand-cream)]/30">
        <div className="relative md:min-h-[80vh] flex items-center justify-center py-12 md:py-0">
          <div className="w-full max-w-[280px] sm:max-w-xs">
            <YouTubeShort
              id="mBXvjsEqAZw"
              title="Atelier cuisine indienne"
              className="shadow-2xl shadow-black/15"
            />
          </div>
        </div>
        <div className="bg-[var(--brand-cream)]/30 flex items-center px-6 sm:px-12 md:px-20 py-16 md:py-0">
          <div className="max-w-md">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-6">
              Ateliers
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05] mb-8">
              Apprendre<br />
              <span className="italic text-[var(--brand-gold)]">ensemble</span>
            </h2>
            <p className="text-[14px] text-gray-700 leading-[1.85] mb-10">
              À domicile, en collectif ou avec un chef privé. Trois formules, un même esprit&nbsp;: la transmission.
            </p>
            <Link
              href="/ateliers"
              className="inline-flex items-center gap-3 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Voir les ateliers <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED TRAITEUR (inversé) ──────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        <div className="bg-white flex items-center px-6 sm:px-12 md:px-20 py-16 md:py-0 order-2 md:order-1">
          <div className="max-w-md">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-6">
              Traiteur
            </p>
            <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05] mb-8">
              À emporter<br />
              <span className="italic text-[var(--brand-gold)]">&amp; sur mesure</span>
            </h2>
            <p className="text-[14px] text-gray-700 leading-[1.85] mb-10">
              Click & Collect à Melesse pour vos plats du moment. Devis sur mesure pour vos événements.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link
                href="/traiteur/emporter"
                className="text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
              >
                À emporter
              </Link>
              <Link
                href="/traiteur/evenementiel"
                className="text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
              >
                Événementiel
              </Link>
            </div>
          </div>
        </div>
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[80vh] order-1 md:order-2">
          <Image
            src="https://i.ibb.co/tTqdZjjS/Citronade-indienne.jpg"
            alt="Citronnade indienne"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </section>

      {/* ── HISTOIRE / SIGNATURE — récit centré ──────────────────── */}
      <section className="relative bg-[var(--brand-cream)]/60 py-24 md:py-36 overflow-hidden">
        {/* Bols décoratifs en rotation lente, en fond */}
        <div className="pointer-events-none absolute -left-16 top-12 md:-left-24 md:top-20 w-44 h-44 md:w-64 md:h-64 opacity-15">
          <div className="w-full h-full animate-spin-slow">
            <Image
              src="https://i.ibb.co/cKKfhCLf/Bol-seul.png"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 11rem, 16rem"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 bottom-12 md:-right-20 md:bottom-20 w-36 h-36 md:w-52 md:h-52 opacity-15">
          <div className="w-full h-full animate-spin-slow-reverse">
            <Image
              src="https://i.ibb.co/cKKfhCLf/Bol-seul.png"
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 768px) 9rem, 13rem"
            />
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          {/* 3 polaroids inclinés à des hauteurs différentes */}
          <div className="relative w-full max-w-2xl mx-auto h-72 sm:h-80 md:h-96 mb-14 md:mb-16">
            <Polaroid
              src="https://i.ibb.co/j9dDKVbS/Entr-samoussas.jpg"
              alt="Samoussas"
              caption="Samoussas"
              className="absolute left-0 sm:left-2 top-10 md:top-14 rotate-[-9deg] hover:rotate-[-4deg] z-10"
            />
            <Polaroid
              src="https://i.ibb.co/Kx5rKtGN/Halwa.jpg"
              alt="Halwa"
              caption="Halwa"
              className="absolute left-1/2 -translate-x-1/2 top-0 rotate-[4deg] hover:rotate-0 z-20"
            />
            <Polaroid
              src="https://i.ibb.co/HfXy27N9/Lassi-sucr.jpg"
              alt="Lassi sucré"
              caption="Lassi"
              className="absolute right-0 sm:right-2 top-16 md:top-20 rotate-[7deg] hover:rotate-[3deg] z-10"
            />
          </div>

          <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
            L&apos;histoire
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-[1.05] mb-8">
            Née dans la cuisine<br />
            <span className="italic text-[var(--brand-gold)]">de ma mère</span>
          </h2>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-10" />

          <p className="font-serif italic text-[16px] md:text-[18px] text-gray-700 leading-[1.9] mb-6 max-w-xl mx-auto">
            Une cuisine remplie de parfums, de gestes précis et de silences chargés d&apos;amour. Chaque mélange d&apos;épices y racontait une histoire.
          </p>
          <p className="text-[14px] md:text-[15px] text-gray-700 leading-[1.9] mb-12 max-w-xl mx-auto">
            <em>Entre Maman et Moi</em>, c&apos;est cette transmission&nbsp;: kits, ateliers, traiteur. Un voyage sensoriel à partager.
          </p>

          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-6" />
          <p className="font-serif italic text-3xl md:text-4xl text-[var(--brand-gold)] tracking-wide">
            Viji
          </p>

          <div className="mt-10">
            <Link
              href="/pages/a-propos"
              className="inline-flex items-center gap-2 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Lire toute l&apos;histoire <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AVIS GOOGLE ─────────────────────────────────────────── */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
              Ils en parlent
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <GoogleLogo size={18} />
              <span className="text-[12px] text-gray-500">Avis Google</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[13px] font-medium text-gray-900">5,0</span>
              <span className="text-[12px] text-gray-400">· 27 avis</span>
            </div>
          </div>
        </div>

        {/* Marquee plein écran */}
        <ReviewMarquee reviews={REVIEWS} />
      </section>

      {/* ── RÉSEAUX SOCIAUX ─────────────────────────────────────── */}
      <section className="bg-[var(--brand-cream)]/40 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          {/* Texte */}
          <div className="md:col-span-5 text-center md:text-left">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-5">
              Sur les réseaux
            </p>
            <h2 className="font-serif text-3xl md:text-5xl text-gray-900 leading-[1.05] mb-7">
              Suivez-nous au{" "}
              <span className="italic text-[var(--brand-gold)]">quotidien</span>
            </h2>
            <div className="w-12 h-px bg-[var(--brand-gold)]/40 mb-7 mx-auto md:mx-0" />
            <p className="font-serif italic text-[15px] text-gray-600 leading-relaxed mb-9 max-w-md mx-auto md:mx-0">
              Coulisses des ateliers, recettes en pas à pas et inspirations
              indiennes. Partageons l&apos;aventure ensemble.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4">
              <SocialIcon href="https://instagram.com/" label="Instagram">
                <InstagramIcon size={15} />
              </SocialIcon>
              <SocialIcon href="https://tiktok.com/" label="TikTok">
                <TikTokIcon size={15} />
              </SocialIcon>
              <SocialIcon href="https://facebook.com/" label="Facebook">
                <FacebookIcon size={15} />
              </SocialIcon>
            </div>
          </div>

          {/* Vidéos côte à côte avec léger décalage */}
          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto md:max-w-none items-start">
              <YouTubeShort
                id="mBXvjsEqAZw"
                title="Aperçu réseau social · vidéo 1"
                className="shadow-xl shadow-black/10"
              />
              <YouTubeShort
                id="tTjZz_wRNLg"
                title="Aperçu réseau social · vidéo 2"
                className="shadow-xl shadow-black/10 mt-8 md:mt-12"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA NEWSLETTER — bandeau compact ─────────────────────── */}
      <section className="bg-white border-y border-[var(--brand-gold)]/20 py-14 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="md:flex-1">
            <p className="text-[10px] uppercase tracking-[0.45em] text-[var(--brand-gold)] mb-3">
              Restons en cuisine
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-gray-900 leading-tight">
              Une <span className="italic text-[var(--brand-gold)]">recette</span> par mois,{" "}
              <span className="text-gray-500 font-serif italic text-xl md:text-2xl">
                directement chez vous.
              </span>
            </h2>
          </div>

          <div className="w-12 h-px bg-[var(--brand-gold)]/40 md:hidden" />

          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 text-[var(--brand-gold)] text-[11px] uppercase tracking-[0.3em] font-medium border border-[var(--brand-gold)]/40 px-7 py-3.5 hover:bg-[var(--brand-gold)] hover:text-white hover:border-[var(--brand-gold)] transition shrink-0"
          >
            S&apos;inscrire
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] flex items-center justify-center hover:bg-[var(--brand-gold)] hover:text-white hover:border-[var(--brand-gold)] transition"
    >
      {children}
    </a>
  );
}

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.43-4.94 8.43-9.94Z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1.84-.05Z" />
    </svg>
  );
}

function Polaroid({
  src,
  alt,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  caption: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white p-3 pb-10 shadow-2xl shadow-black/25 transition-transform duration-700 ${className}`}
    >
      <div className="relative w-32 h-40 sm:w-36 sm:h-44 md:w-44 md:h-52 overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 8rem, 11rem"
        />
      </div>
      <p className="font-serif italic text-[12px] md:text-[13px] text-gray-600 text-center mt-3">
        {caption}
      </p>
    </div>
  );
}

function GoogleLogo({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const DEFAULT_KITS = [
  // Découverte → Samoussa (un des produits du kit, image la plus iconique pour une initiation)
  { slug: "decouverte", name: "Kit Découverte", image: "https://i.ibb.co/RT04pLXX/Samoussa.jpg" },
  // Signature → Poulet Tandoori (rouge dramatique, visuel "signature")
  { slug: "signature", name: "Kit Signature", image: "https://i.ibb.co/gF9GBhD7/Poulet-Tandoori.jpg" },
  // Familiale → Beef Rice Lemon (assiette complète, idée de festin partagé)
  { slug: "familiale", name: "Kit Familiale", image: "https://i.ibb.co/gLLnvsYg/Beef-Rice-Lemon.jpg" },
];
