"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface HeroImage {
  src: string;
  alt: string;
}

interface Props {
  images: HeroImage[];
  eyebrow?: string;
  title?: string;
  titleAccent?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export default function HeroSection({
  images,
  eyebrow = "Cuisine indienne · Rennes",
  title = "Voyagez au",
  titleAccent = "cœur de l'Inde",
  ctaPrimary = "Découvrir les kits",
  ctaSecondary = "Voir les ateliers",
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <>
      {/* HERO PLEIN ÉCRAN */}
      <section className="relative h-[70vh] min-h-[460px] sm:h-[80vh] sm:min-h-[540px] md:h-[88vh] md:min-h-[600px] overflow-hidden">
        {images.map((img, i) => (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-black/15" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-20 md:pb-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full text-white">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.45em] text-white/70 mb-4 sm:mb-6">
              {eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-[8rem] leading-[0.95] font-normal max-w-4xl">
              {title}<br />
              <span className="italic text-[var(--brand-gold)]">{titleAccent}</span>
            </h1>
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-6">
              <Link
                href="/kits/decouverte"
                className="inline-flex items-center gap-3 bg-white text-gray-900 px-6 sm:px-8 py-3.5 sm:py-4 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] font-medium hover:bg-[var(--brand-gold)] hover:text-white transition"
              >
                {ctaPrimary}
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/ateliers/a-domicile"
                className="inline-flex items-center gap-2 text-white text-[10px] sm:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] border-b border-white/40 pb-1 hover:border-white transition"
              >
                {ctaSecondary}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-[10px] uppercase tracking-[0.3em] hidden md:block">
          Faites défiler
        </div>
      </section>

      {/* BANDEAU IMAGES interactives — survol = change le hero */}
      <section className="grid grid-cols-3 sm:grid-cols-6 gap-1">
        {images.slice(0, 6).map((img, i) => (
          <button
            key={img.src}
            type="button"
            onMouseEnter={() => setActiveIndex(i)}
            onFocus={() => setActiveIndex(i)}
            className={`relative aspect-square overflow-hidden cursor-pointer transition-opacity ${
              i === activeIndex ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
            aria-label={`Voir ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 33vw, 17vw"
            />
            {i === activeIndex && (
              <span className="absolute inset-0 ring-2 ring-inset ring-[var(--brand-gold)] pointer-events-none" />
            )}
          </button>
        ))}
      </section>
    </>
  );
}
