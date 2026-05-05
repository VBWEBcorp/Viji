"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2, ArrowRight } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";
import toast from "react-hot-toast";

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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes favoris</h1>
      <p className="text-sm text-gray-500 mb-6">
        {products.length} produit{products.length > 1 ? "s" : ""} sauvegarde{products.length > 1 ? "s" : ""}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucun favori</h2>
          <p className="text-sm text-gray-500 mb-6">
            Parcourez nos produits et cliquez sur le coeur pour sauvegarder vos coups de coeur.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Découvrir nos produits <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={String(product._id)} className="relative group">
              <ProductCard product={{ ...product, _id: String(product._id) }} />
              <button
                onClick={() => removeFromWishlist(String(product._id))}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                title="Retirer des favoris"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
