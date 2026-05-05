"use client";

import Image from "next/image";

interface ImageMarqueeProps {
  images: { url: string; alt: string; name: string; price: number }[];
  direction?: "left" | "right";
  speed?: number;
}

export default function ImageMarquee({ images, direction = "left", speed = 35 }: ImageMarqueeProps) {
  if (images.length === 0) return null;

  const allImages = [...images, ...images];

  return (
    <div className="overflow-hidden">
      <div
        className={direction === "left" ? "animate-marquee" : "animate-marquee-reverse"}
        style={{
          display: "flex",
          gap: "1rem",
          animationDuration: `${speed}s`,
        }}
      >
        {allImages.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            className="shrink-0 w-[220px] sm:w-[280px] group"
          >
            <div className="relative aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.alt || img.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="280px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-sm font-semibold truncate">{img.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
