"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Heart, MapPin, Send, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";

const EMM_LOGO_SRC = "https://i.ibb.co/V0XmmQRt/logo-entre-maman-et-moi.jpg";

type Block = { type: "p" | "h4"; text: string };

interface PressArticle {
  id: string;
  publication: string;
  publicationLogo: { src: string; alt: string; width: number; height: number };
  /** Classes Tailwind pour la taille du logo (varie selon le logo). */
  publicationLogoClass: string;
  cityTag: string;
  /** Couleur du badge ville (Ouest France → rouge, Actu Rennes → bleu clair). */
  cityTagColor: string;
  title: string;
  photo: { src: string; alt: string; caption: string; credit: string };
  body: Block[];
  contact?: string;
}

const ARTICLES: PressArticle[] = [
  {
    id: "ouest-france",
    publication: "Ouest France",
    publicationLogo: {
      src: "https://i.ibb.co/PvNPqYJp/Ouest-france.png",
      alt: "Ouest France",
      width: 280,
      height: 110,
    },
    publicationLogoClass: "h-9 sm:h-11 md:h-12 w-auto",
    cityTag: "Vern-sur-Seiche",
    cityTagColor: "#E2001A",
    title: "Viji Tinot veut faire découvrir la cuisine indienne",
    photo: {
      src: "https://i.ibb.co/27cYB8tN/viji-article.png",
      alt: "Viji Tinot dans sa cuisine",
      caption: "Viji Tinot a lancé son activité sous le nom de Entre Maman et moi.",
      credit: "OUEST-FRANCE",
    },
    body: [
      {
        type: "p",
        text: "Architecte d'intérieur de formation, Viji Tinot, 28 ans, a changé de voie. La jeune femme aux origines italiennes et indiennes, qui a grandi en région rennaise avant de s'installer à Vern-sur-Seiche, a lancé son affaire, *Entre Maman et moi*.",
      },
      {
        type: "p",
        text: "« À un moment, j'ai eu envie de prendre un temps pour moi et de revenir à mes racines. La culture de l'Inde me manquait un peu beaucoup, surtout au niveau culinaire. J'avais envie de retrouver les senteurs de mon enfance et de les partager grâce à l'héritage culinaire de ma mère. »",
      },
      {
        type: "p",
        text: "Viji Tinot a une activité de traiteur, avec des commandes à retirer ou à se faire livrer avec Uber Eats. Elle ambitionne également d'aller sur les marchés.",
      },
      { type: "h4", text: "Des box avec des recettes et des épices" },
      {
        type: "p",
        text: "Elle propose à la vente des box (trois catégories différentes) avec les recettes et les épices nécessaires à la réalisation des menus. « Les recettes indiennes sont authentiques et pensées pour le quotidien, avec une liste de courses permettant de maîtriser les quantités, de ne pas gaspiller et de gagner du temps. »",
      },
      {
        type: "p",
        text: "L'entrepreneuse organise aussi, près de Rennes, des ateliers de cuisine où tout est fourni : ingrédients, épices, matériel et tablier.",
      },
    ],
    contact:
      "site internet : entre-maman-et-moi.fr · Instagram : @entremamanetmoi",
  },
  {
    id: "actu-rennes",
    publication: "Actu Rennes",
    publicationLogo: {
      src: "https://i.ibb.co/pq7xWvp/Actu-Rennes.webp",
      alt: "Actu Rennes",
      width: 280,
      height: 110,
    },
    publicationLogoClass: "h-14 sm:h-16 md:h-20 w-auto",
    cityTag: "Rennes",
    cityTagColor: "#30A1EF",
    title: "Ex-architecte, elle fait revivre la cuisine indienne de sa maman",
    photo: {
      src: "https://i.ibb.co/LfK771p/Viji-actu-rennes.jpg",
      alt: "Viji Tinot avec ses box Entre Maman et Moi",
      caption:
        "Grâce aux recettes de sa mère, la cuisine indienne n'a plus de secrets pour Viji Tinot.",
      credit: "ACTU RENNES",
    },
    body: [
      {
        type: "p",
        text: "Grâce aux recettes de sa mère, la cuisine indienne n'a plus de secrets pour Viji Tinot, qui a lancé son activité de traiteur avec *Entre maman et moi*, près de Rennes.",
      },
      {
        type: "p",
        text: "Architecte d'intérieur de formation, la jeune femme aux racines indo-italiennes, installée à Vern-sur-Seiche, s'est tournée vers la cuisine de sa mère pour lancer son projet : service traiteur, box culinaires et ateliers, autour des recettes de famille.",
      },
      {
        type: "p",
        text: "« J'avais besoin de revenir à mes origines, de retrouver les senteurs et les saveurs de mon enfance. Avec Entre maman et moi, je transmets cet héritage culinaire à un large public. »",
      },
      { type: "h4", text: "Traiteur, box et ateliers" },
      {
        type: "p",
        text: "Au programme : des plats à emporter ou livrés, des box à composer soi-même (recettes pas à pas et épices) et des ateliers près de Rennes où elle dévoile les techniques fondamentales et l'équilibre des saveurs indiennes.",
      },
    ],
    contact:
      "site internet : entre-maman-et-moi.fr · Instagram : @entremamanetmoi",
  },
];

export default function PressSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const article = ARTICLES[index];
  const total = ARTICLES.length;

  return (
    <section className="relative bg-gradient-to-b from-[var(--brand-cream)]/70 via-[#f5efe1] to-[var(--brand-cream)]/70 py-20 md:py-32 overflow-hidden">
      {/* Texture papier journal très subtile */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, #6b4a1f 0.6px, transparent 0.8px), radial-gradient(circle at 70% 60%, #6b4a1f 0.5px, transparent 0.8px), radial-gradient(circle at 40% 80%, #6b4a1f 0.4px, transparent 0.8px)",
          backgroundSize: "37px 37px, 53px 53px, 23px 23px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        {/* En-tête de section */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
            Vu dans la presse
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05] mb-5">
            Ils <span className="italic text-[var(--brand-gold)]">parlent</span> de nous
          </h2>
          <p className="text-[11px] sm:text-[12px] uppercase tracking-[0.35em] text-[var(--brand-gold)] font-medium mb-7">
            Ouest&nbsp;France · Actu&nbsp;Rennes
          </p>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-7" />
          <p className="font-serif italic text-[15px] md:text-[17px] text-gray-600 leading-relaxed max-w-xl mx-auto">
            Découvrez l&apos;histoire d&apos;
            <em className="not-italic font-medium text-gray-800">Entre Maman et Moi</em>,
            mise en lumière par <em className="not-italic font-medium text-gray-800">Ouest&nbsp;France</em> et <em className="not-italic font-medium text-gray-800">Actu&nbsp;Rennes</em>.
          </p>
        </div>

        {/* Méta presse au-dessus de l'article */}
        <div
          className={`flex items-center justify-center gap-4 mb-6 md:mb-8 transition-all duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="block w-8 h-px bg-[var(--brand-gold)]/40" />
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 font-medium">
            Édition · {article.publication}
          </p>
          <span className="block w-8 h-px bg-[var(--brand-gold)]/40" />
        </div>

        {/* Carrousel — un article à la fois */}
        <div
          ref={ref}
          className={`relative mx-auto w-full max-w-[560px] md:max-w-[620px] transition-all duration-1000 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Flèche gauche */}
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            aria-label="Article précédent"
            className="absolute left-1 sm:-left-4 md:-left-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center hover:bg-[var(--brand-gold)] hover:text-white transition-colors shadow-md"
          >
            <ChevronLeft size={18} strokeWidth={1.6} />
          </button>

          {/* Flèche droite */}
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % total)}
            aria-label="Article suivant"
            className="absolute right-1 sm:-right-4 md:-right-14 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center hover:bg-[var(--brand-gold)] hover:text-white transition-colors shadow-md"
          >
            <ChevronRight size={18} strokeWidth={1.6} />
          </button>

          {/* Carte article — sans hover */}
          <PressCard key={article.id} article={article} />

          {/* Dots */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {ARTICLES.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Voir l'article ${a.publication}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-8 bg-[var(--brand-gold)]"
                    : "w-2 bg-[var(--brand-gold)]/30 hover:bg-[var(--brand-gold)]/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PressCard({ article }: { article: PressArticle }) {
  return (
    <div className="relative">
      {/* Coins or discrets */}
      <Corner className="-top-2 -left-2 rotate-0" />
      <Corner className="-top-2 -right-2 rotate-90" />
      <Corner className="-bottom-2 -left-2 -rotate-90" />
      <Corner className="-bottom-2 -right-2 rotate-180" />

      <article
        className="relative bg-white rounded-[2px] px-6 sm:px-9 md:px-12 pt-8 sm:pt-10 pb-7 sm:pb-9"
        style={{
          boxShadow:
            "0 40px 70px -25px rgba(60,40,15,0.32), 0 20px 35px -15px rgba(60,40,15,0.18), 0 0 0 1px rgba(184,146,60,0.06)",
        }}
      >
        {/* Bandeau LOGOS */}
        <header className="flex items-center justify-center gap-5 sm:gap-7 md:gap-9 mb-5 sm:mb-6">
          <EmmLogo />
          <span
            aria-hidden
            className="font-serif text-2xl sm:text-3xl text-gray-700 font-light leading-none"
          >
            ✕
          </span>
          <Image
            src={article.publicationLogo.src}
            alt={article.publicationLogo.alt}
            width={article.publicationLogo.width}
            height={article.publicationLogo.height}
            className={`${article.publicationLogoClass} shrink-0 object-contain`}
            unoptimized
          />
        </header>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-400/30 to-transparent mb-6" />

        {/* Étiquette ville — couleur définie par l'article */}
        <p
          className="inline-block text-white px-2.5 py-[3px] text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-bold mb-3 align-middle"
          style={{ backgroundColor: article.cityTagColor }}
        >
          {article.cityTag}
        </p>

        {/* Titre presse */}
        <h3 className="font-serif font-bold text-[22px] sm:text-[28px] md:text-[32px] leading-[1.08] text-gray-900 mb-6 max-w-[22ch]">
          {article.title}
        </h3>

        {/* Corps de l'article — 2 colonnes avec photo flottante */}
        <div className="press-body text-gray-800 text-[12.5px] sm:text-[13px] md:text-[13.5px] leading-[1.6] font-serif text-justify hyphens-auto md:columns-2 md:gap-7">
          <figure className="float-right ml-3 mb-2 w-[44%] sm:w-[42%] md:w-full md:float-none md:ml-0 md:mb-3 md:mt-1 break-inside-avoid">
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-200 ring-1 ring-black/[0.04]">
              <Image
                src={article.photo.src}
                alt={article.photo.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 60vw, 420px"
              />
            </div>
            <figcaption className="text-[10px] sm:text-[10.5px] leading-[1.4] text-gray-700 mt-1.5 italic">
              {article.photo.caption}
              <span className="block not-italic text-[9px] font-semibold tracking-[0.08em] text-gray-500 mt-0.5">
                | PHOTO : {article.photo.credit}
              </span>
            </figcaption>
          </figure>

          {article.body.map((block, idx) =>
            block.type === "h4" ? (
              <h4
                key={idx}
                className="font-serif font-bold text-[14px] sm:text-[15px] md:text-[15.5px] text-gray-900 mb-2 mt-2 break-inside-avoid leading-tight"
              >
                {block.text}
              </h4>
            ) : (
              <p
                key={idx}
                className="mb-3"
                dangerouslySetInnerHTML={{ __html: formatParagraph(block.text) }}
              />
            ),
          )}

          {article.contact && (
            <p className="text-[11px] sm:text-[11.5px] text-gray-700 leading-[1.55] mt-3 break-inside-avoid">
              <span className="font-semibold">Contact&nbsp;:</span> {article.contact}
            </p>
          )}
        </div>

        {/* Pied d'article : icônes + trait ondulé (comme la première version) */}
        <div className="mt-9 sm:mt-10 pt-5 border-t border-gray-300/30 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-7 sm:gap-8 text-gray-700">
            <Heart size={17} strokeWidth={1.4} />
            <MapPin size={17} strokeWidth={1.4} />
            <Send size={17} strokeWidth={1.4} className="-rotate-12" />
            <Bookmark size={17} strokeWidth={1.4} />
          </div>
          <svg
            viewBox="0 0 240 14"
            className="w-[200px] sm:w-[230px] h-3 text-gray-700/80"
            aria-hidden="true"
          >
            <path
              d="M2 8 Q 22 -2, 42 8 T 82 8 T 122 8 T 162 8 T 202 8 T 238 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </article>
    </div>
  );
}

/** Convertit *italique* en <em>italique</em>. Conserve les apostrophes typographiques. */
function formatParagraph(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute w-4 h-4 pointer-events-none ${className}`}
      style={{
        borderTop: "1px solid rgba(184,146,60,0.55)",
        borderLeft: "1px solid rgba(184,146,60,0.55)",
      }}
    />
  );
}

function EmmLogo() {
  return (
    <Image
      src={EMM_LOGO_SRC}
      alt="Entre Maman et Moi"
      width={160}
      height={160}
      className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] md:w-[76px] md:h-[76px] shrink-0 object-contain"
    />
  );
}
