"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface YouTubeShortProps {
  id: string;
  title?: string;
  className?: string;
}

export default function YouTubeShort({
  id,
  title,
  className = "",
}: YouTubeShortProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3`;
  const posterSrc = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <div
      ref={ref}
      className={`relative aspect-[9/16] overflow-hidden bg-[var(--brand-cream)] ${className}`}
    >
      {/* Poster — toujours présent, sert de fallback pendant le chargement */}
      <Image
        src={posterSrc}
        alt={title || "Aperçu vidéo"}
        fill
        sizes="(max-width: 768px) 90vw, 280px"
        className="object-cover"
        style={{ transform: "scale(1.4)", transformOrigin: "center" }}
      />

      {shouldLoad && (
        <iframe
          src={src}
          title={title || "Vidéo"}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "scale(1.4)", transformOrigin: "center" }}
        />
      )}
    </div>
  );
}
