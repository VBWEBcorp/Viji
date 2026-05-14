"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";
import toast from "react-hot-toast";
import { usePageTitle } from "@/lib/use-page-title";

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images: { url: string; alt: string }[];
  category?: { name: string; slug: string };
}

export default function WishlistPage() {
  usePageTitle("Mes favoris");
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      });
  }, []);

  async function removeFromWishlist(productId: string) {
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setProducts((prev) => prev.filter((p) => String(p._id) !== productId));
    toast.success("Retiré des favoris");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-4">
          Sélection
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-gray-900 leading-[1.05]">
          Mes <span className="italic text-[var(--brand-gold)]">favoris</span>
        </h1>
        <div className="w-12 h-px bg-[var(--brand-gold)]/40 mt-7" />
        <p className="font-serif italic text-[14px] text-gray-500 mt-7">
          {products.length} produit{products.length > 1 ? "s" : ""} sauvegardé
          {products.length > 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[var(--brand-cream)] aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[var(--brand-gold)]/15 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center mx-auto mb-5">
            <Heart size={18} strokeWidth={1.5} />
          </div>
          <p className="font-serif italic text-2xl text-gray-900 mb-2">
            Aucun coup de cœur encore…
          </p>
          <p className="text-[13px] text-gray-500 mb-7 max-w-xs mx-auto leading-relaxed">
            Parcourez la boutique et cliquez sur le cœur pour sauvegarder vos favoris.
          </p>
          <Link
            href="/kits/decouverte"
            className="inline-flex items-center gap-3 bg-[var(--brand-gold)] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
          >
            Découvrir les kits
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={String(product._id)} className="relative group">
              <ProductCard product={{ ...product, _id: String(product._id) }} />
              <button
                onClick={() => removeFromWishlist(String(product._id))}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur border border-[var(--brand-gold)]/20 flex items-center justify-center text-[var(--brand-gold)]/60 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)] opacity-0 group-hover:opacity-100 transition-all"
                title="Retirer des favoris"
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
