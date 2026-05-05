"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ImageMarquee from "@/components/shop/ImageMarquee";
import ProductCarousel from "@/components/shop/ProductCarousel";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  category?: { name: string; slug: string };
}

interface MarqueeImage {
  url: string;
  alt: string;
  name: string;
  price: number;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface HomeClientProps {
  marqueeImages: MarqueeImage[];
  featured: Product[];
  latest: Product[];
  categories: CategoryItem[];
  labels: {
    featuredEyebrow: string;
    featuredTitle: string;
    latestEyebrow: string;
    latestTitle: string;
  };
}

export default function HomeClient({ marqueeImages, featured, latest, categories, labels }: HomeClientProps) {
  return (
    <>
      {/* ══════════════════════════════════════════
          IMAGE CAROUSEL — Defilement auto
      ══════════════════════════════════════════ */}
      {marqueeImages.length > 0 && (
        <section className="py-12 overflow-hidden">
          <ImageMarquee images={marqueeImages.slice(0, 8)} direction="left" speed={40} />
          {marqueeImages.length > 8 && (
            <div className="mt-4">
              <ImageMarquee images={marqueeImages.slice(8)} direction="right" speed={35} />
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════
          CATEGORIES — Pills horizontales
      ══════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
            <Link
              href="/products"
              className="shrink-0 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-full hover:bg-gray-800 transition"
            >
              Tout voir
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat._id}`}
                className="shrink-0 px-5 py-2.5 bg-gray-100 text-gray-700 text-[13px] font-medium rounded-full hover:bg-gray-200 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FEATURED — Carousel horizontal
      ══════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  {labels.featuredEyebrow}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  {labels.featuredTitle}
                </h2>
              </div>
              <Link
                href="/products?featured=true"
                className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition font-medium border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-300 bg-white"
              >
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>
            <ProductCarousel products={featured} />
            <div className="sm:hidden mt-8 text-center">
              <Link
                href="/products?featured=true"
                className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition font-medium"
              >
                Tout voir <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          LATEST — Carousel horizontal
      ══════════════════════════════════════════ */}
      {latest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {labels.latestEyebrow}
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {labels.latestTitle}
              </h2>
            </div>
            <Link
              href="/products?sort=createdAt&order=desc"
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-900 transition font-medium border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-300"
            >
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <ProductCarousel products={latest} />
        </section>
      )}
    </>
  );
}
