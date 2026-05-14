"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getMarketing, type MarketingData } from "@/lib/marketingCache";

type BannerData = NonNullable<MarketingData["banner"]>;

export default function PromoBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getMarketing().then((data) => {
      if (data.banner?.isActive && data.banner?.text) {
        setBanner(data.banner);
      }
    });
  }, []);

  if (!banner || dismissed) return null;

  const speed = banner.speed || 30;

  return (
    <div
      className="relative overflow-hidden py-2.5"
      style={{ backgroundColor: banner.backgroundColor }}
    >
      <div
        className="animate-marquee flex items-center gap-10 whitespace-nowrap"
        style={{ color: banner.textColor, animationDuration: `${speed}s` }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="flex items-center gap-3 text-[13px] font-medium">
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: banner.textColor, opacity: 0.4 }}
            />
            {banner.linkUrl ? (
              <a href={banner.linkUrl} className="hover:underline">
                {banner.text}
              </a>
            ) : (
              banner.text
            )}
          </span>
        ))}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition"
        style={{ color: banner.textColor }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
