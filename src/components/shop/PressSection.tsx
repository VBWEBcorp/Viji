"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Heart, MapPin, Send, Bookmark } from "lucide-react";

const PORTRAIT_SRC = "https://i.ibb.co/27cYB8tN/viji-article.png";

export default function PressSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-[var(--brand-cream)]/70 via-[#f5efe1] to-[var(--brand-cream)]/70 py-24 md:py-36 overflow-hidden">
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
        <div className="text-center mb-14 md:mb-20">
          <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-5">
            Vu dans la presse
          </p>
          <h2 className="font-serif text-4xl md:text-6xl text-gray-900 leading-[1.05] mb-7">
            Ils <span className="italic text-[var(--brand-gold)]">parlent</span> de nous
          </h2>
          <div className="w-12 h-px bg-[var(--brand-gold)] mx-auto mb-7" />
          <p className="font-serif italic text-[15px] md:text-[17px] text-gray-600 leading-relaxed max-w-xl mx-auto">
            Découvrez l&apos;histoire d&apos;
            <em className="not-italic font-medium text-gray-800">Entre Maman et Moi</em>,
            mise en lumière par la presse locale.
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
            Édition · Ouest France
          </p>
          <span className="block w-8 h-px bg-[var(--brand-gold)]/40" />
        </div>

        {/* Coupure de presse */}
        <div
          ref={ref}
          className={`relative mx-auto w-full max-w-[560px] md:max-w-[620px] transition-all duration-1000 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          {/* Coins or discrets */}
          <Corner className="-top-2 -left-2 rotate-0" />
          <Corner className="-top-2 -right-2 rotate-90" />
          <Corner className="-bottom-2 -left-2 -rotate-90" />
          <Corner className="-bottom-2 -right-2 rotate-180" />

          <article
            className="group relative bg-white rounded-[2px] px-6 sm:px-9 md:px-12 pt-8 sm:pt-10 pb-7 sm:pb-9 -rotate-[0.25deg] hover:rotate-0 transition-all duration-700 ease-out hover:-translate-y-1"
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
              <OuestFranceLogo />
            </header>

            <div className="h-px bg-gradient-to-r from-transparent via-gray-400/30 to-transparent mb-6" />

            {/* Étiquette ville */}
            <p className="inline-block bg-[#b32a1d] text-white px-2.5 py-[3px] text-[9px] sm:text-[10px] uppercase tracking-[0.18em] font-bold mb-3 align-middle">
              Vern-sur-Seiche
            </p>

            {/* Titre presse */}
            <h3 className="font-serif font-bold text-[22px] sm:text-[28px] md:text-[32px] leading-[1.08] text-gray-900 mb-6 max-w-[22ch]">
              Viji Tinot veut faire découvrir la cuisine indienne
            </h3>

            {/* Corps de l'article — 2 colonnes avec photo intégrée */}
            <div className="press-body text-gray-800 text-[12.5px] sm:text-[13px] md:text-[13.5px] leading-[1.6] font-serif text-justify hyphens-auto md:columns-2 md:gap-7">
              {/* Photo flottante à droite dans la colonne (mobile : floate aussi) */}
              <figure className="float-right ml-3 mb-2 w-[44%] sm:w-[42%] md:w-full md:float-none md:ml-0 md:mb-3 md:mt-1 break-inside-avoid">
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-200 ring-1 ring-black/[0.04]">
                  <Image
                    src={PORTRAIT_SRC}
                    alt="Viji Tinot dans sa cuisine"
                    fill
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-[1400ms] ease-out"
                    sizes="(max-width: 768px) 60vw, 420px"
                  />
                </div>
                <figcaption className="text-[10px] sm:text-[10.5px] leading-[1.4] text-gray-700 mt-1.5 italic">
                  Viji Tinot a lancé son activité sous le nom de Entre Maman et moi.
                  <span className="block not-italic text-[9px] font-semibold tracking-[0.08em] text-gray-500 mt-0.5">
                    | PHOTO : OUEST-FRANCE
                  </span>
                </figcaption>
              </figure>

              <p className="mb-3">
                Architecte d&apos;intérieur de formation, Viji Tinot, 28 ans, a changé de voie. La jeune femme aux origines italiennes et indiennes, qui a grandi en région rennaise avant de s&apos;installer à Vern-sur-Seiche, a lancé son affaire, <em>Entre Maman et moi</em>.
              </p>
              <p className="mb-3">
                «&nbsp;À un moment, j&apos;ai eu envie de prendre un temps pour moi et de revenir à mes racines. La culture de l&apos;Inde me manquait un peu beaucoup, surtout au niveau culinaire. J&apos;avais envie de retrouver les senteurs de mon enfance et de les partager grâce à l&apos;héritage culinaire de ma mère.&nbsp;»
              </p>
              <p className="mb-3">
                Viji Tinot a une activité de traiteur, avec des commandes à retirer au 34, rue de la Libération ou à se faire livrer avec Uber Eats. Elle ambitionne également d&apos;aller sur les marchés.
              </p>

              <h4 className="font-serif font-bold text-[14px] sm:text-[15px] md:text-[15.5px] text-gray-900 mb-2 mt-2 break-inside-avoid leading-tight">
                Des box avec des recettes et des épices
              </h4>

              <p className="mb-3">
                Mais la jeune femme ne s&apos;arrête pas là. Elle propose à la vente des box (trois catégories différentes), avec des recettes et les épices nécessaires à la réalisation des menus. «&nbsp;Les recettes indiennes sont authentiques et pensées pour le quotidien, avec une liste de courses permettant de maîtriser les quantités, de ne pas gaspiller et de gagner du temps&nbsp;», explique Viji Tinot. Avec ces box, elle veut s&apos;adresser à un large public, «&nbsp;même à ceux qui pensent que la cuisine indienne est trop compliquée, trop longue ou réservée aux restaurants&nbsp;».
              </p>
              <p className="mb-3">
                L&apos;entrepreneuse organise aussi, près de Rennes, des ateliers de cuisine où tout est fourni&nbsp;: ingrédients, épices, matériel et tablier. «&nbsp;Je fais découvrir les secrets de la cuisine indienne, les techniques fondamentales et l&apos;équilibre des saveurs. On cuisine ensemble et on déguste le repas.&nbsp;»
              </p>

              <p className="text-[11px] sm:text-[11.5px] text-gray-700 leading-[1.55] mt-3 break-inside-avoid">
                <span className="font-semibold">Contact&nbsp;:</span> tél. 07 67 36 09 26, site internet&nbsp;: entre-maman-et-moi.fr, page Instagram&nbsp;: @entremamanetmoi
              </p>
            </div>

            {/* Pied d'article : icônes + trait ondulé */}
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

      </div>
    </section>
  );
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

/* ───────── Logos ───────── */

function EmmLogo() {
  return (
    <Image
      src="https://i.ibb.co/V0XmmQRt/logo-entre-maman-et-moi.jpg"
      alt="Entre Maman et Moi"
      width={160}
      height={160}
      className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] md:w-[76px] md:h-[76px] shrink-0 object-contain"
    />
  );
}

function OuestFranceLogo() {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <div className="bg-[#e2231a] text-white px-2 sm:px-2.5 py-1 sm:py-1.5 leading-[0.95]">
        <p className="font-sans font-extrabold text-[13px] sm:text-[15px] md:text-[17px] tracking-tight">
          ouest
        </p>
        <p className="font-sans font-extrabold text-[13px] sm:text-[15px] md:text-[17px] tracking-tight">
          france
        </p>
      </div>
      <svg
        viewBox="0 0 40 40"
        className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-[#e2231a]"
        aria-hidden="true"
      >
        <g fill="currentColor">
          <path d="M20 4 a16 16 0 0 1 16 16 h-5 a11 11 0 0 0 -11 -11 z" />
          <path d="M36 20 a16 16 0 0 1 -16 16 v-5 a11 11 0 0 0 11 -11 z" />
          <path d="M20 36 a16 16 0 0 1 -16 -16 h5 a11 11 0 0 0 11 11 z" />
        </g>
        <circle cx="20" cy="20" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}
