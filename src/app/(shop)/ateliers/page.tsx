import Link from "next/link";
import { ArrowRight } from "lucide-react";
import YouTubeShort from "@/components/shop/YouTubeShort";

export const metadata = {
  title: "Ateliers cuisine indienne",
  description:
    "Trois formules d'ateliers cuisine indienne : à domicile, collectif ou chef privé à domicile.",
};

const ATELIERS = [
  {
    slug: "a-domicile",
    title: "Atelier à domicile",
    tagline: "Pour un petit groupe, chez vous",
    videoId: "mBXvjsEqAZw",
    summary: "Je viens chez vous avec ingrédients, épices et matériel. Atelier convivial, repas dégusté ensemble.",
  },
  {
    slug: "collectif",
    title: "Atelier collectif",
    tagline: "En groupe dans notre cuisine",
    videoId: "xdbz0OvLut4",
    summary: "Atelier ouvert à plusieurs participants : apprentissage, partage et dégustation.",
  },
  {
    slug: "chef-prive",
    title: "Chef privé à domicile",
    tagline: "Service traiteur sur mesure",
    videoId: "iOiZLd2s9KU",
    summary: "Je cuisine pour vous et vos invités. Menu personnalisé, service à domicile.",
  },
];

export default function AteliersIndex() {
  return (
    <div className="bg-white">
      <header className="border-y border-[var(--brand-gold)]/20 py-12 md:py-16 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-gray-500 mb-3">Ateliers</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[var(--brand-gold)] uppercase tracking-wide">
          Cuisine indienne
        </h1>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {ATELIERS.map((a) => (
            <Link key={a.slug} href={`/ateliers/${a.slug}`} className="group block">
              <div className="relative mb-6">
                <YouTubeShort
                  id={a.videoId}
                  title={a.title}
                  className="shadow-xl shadow-black/10 group-hover:shadow-2xl transition-shadow"
                />
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
                {a.tagline}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-gray-900 leading-tight mb-3 group-hover:text-[var(--brand-gold)] transition">
                {a.title}
              </h2>
              <div className="w-8 h-px bg-[var(--brand-gold)]/40 mb-4" />
              <p className="text-[13px] text-gray-600 leading-relaxed font-serif italic mb-5">
                {a.summary}
              </p>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                En savoir plus <ArrowRight size={12} />
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
