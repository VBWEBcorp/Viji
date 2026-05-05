"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

interface RecentProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  category?: { name: string; slug: string };
}

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 12;

export function trackProductView(product: RecentProduct) {
  if (typeof window === "undefined") return;

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentProduct[];
  const filtered = stored.filter((p) => p._id !== product._id);
  filtered.unshift(product);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

export default function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as RecentProduct[];
    const filtered = excludeId ? stored.filter((p) => p._id !== excludeId) : stored;
    setProducts(filtered.slice(0, 4));
  }, [excludeId]);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <h2 className="text-xl font-bold mb-6">Récemment consultés</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
