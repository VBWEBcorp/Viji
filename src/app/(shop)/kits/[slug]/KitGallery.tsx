"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Props {
  images: { url: string; alt: string }[];
  name: string;
}

/**
 * Galerie d'un kit qui a plusieurs photos : les photos défilent au doigt
 * (défilement natif, sans bibliothèque), et les vignettes mènent à chacune.
 * Sans JavaScript, le défilement horizontal suffit à tout voir.
 */
export default function KitGallery({ images, name }: Props) {
  const piste = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function aller(i: number) {
    const el = piste.current;
    if (!el) return;
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: doux ? "smooth" : "auto" });
    setActive(i);
  }

  function suivre() {
    const el = piste.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return (
    <div
      role="group"
      aria-roledescription="carrousel"
      aria-label={`Photos : ${name}`}
      className="absolute inset-0"
    >
      <div
        ref={piste}
        onScroll={suivre}
        tabIndex={0}
        className="flex h-full w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
      >
        {images.map((img, i) => (
          <div
            key={img.url}
            role="group"
            aria-roledescription="photo"
            aria-label={`${i + 1} sur ${images.length}`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={img.url}
              alt={img.alt || name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>

      {/* Vignettes : une par photo, posées sur le bas du visuel */}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 p-3 pointer-events-none">
        {images.map((img, i) => (
          <button
            key={img.url}
            type="button"
            onClick={() => aller(i)}
            aria-label={`Voir la photo ${i + 1} sur ${images.length}`}
            aria-current={active === i ? "true" : undefined}
            className={`pointer-events-auto relative h-11 w-11 shrink-0 overflow-hidden border-2 bg-white transition-opacity duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-gold)] ${
              active === i
                ? "border-white opacity-100 shadow"
                : "border-white/70 opacity-75 hover:opacity-100"
            }`}
          >
            <Image
              src={img.url}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              sizes="44px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
