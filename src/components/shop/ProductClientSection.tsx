"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import ReviewSection from "./ReviewSection";

interface Variant {
  name: string;
  options: { value: string; priceModifier: number; stock: number }[];
}

interface ProductClientProps {
  productId: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  variants: Variant[];
}

export default function ProductClientSection({
  productId,
  price,
  compareAtPrice,
  stock,
  variants,
}: ProductClientProps) {
  const { addItem } = useCart();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    variants.forEach((v) => {
      if (v.options.length > 0) defaults[v.name] = v.options[0].value;
    });
    return defaults;
  });
  const [wishlisted, setWishlisted] = useState(false);

  const currentPrice =
    price +
    Object.entries(selectedVariants).reduce((acc, [variantName, optionValue]) => {
      const variant = variants.find((v) => v.name === variantName);
      const option = variant?.options.find((o) => o.value === optionValue);
      return acc + (option?.priceModifier || 0);
    }, 0);

  async function addToCart() {
    const variant = Object.entries(selectedVariants)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const success = await addItem(productId, variant || undefined, quantity);
    if (success) {
      toast.success("Produit ajouté au panier");
    } else {
      toast.error("Erreur lors de l'ajout au panier");
    }
  }

  async function toggleWishlist() {
    if (!session) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    const method = wishlisted ? "DELETE" : "POST";
    await fetch("/api/wishlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setWishlisted(!wishlisted);
    toast.success(wishlisted ? "Retiré des favoris" : "Ajouté aux favoris");
  }

  return (
    <>
      {/* Price */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</span>
        {compareAtPrice && compareAtPrice > currentPrice && (
          <span className="text-lg text-gray-400 line-through">{formatPrice(compareAtPrice)}</span>
        )}
        {compareAtPrice && compareAtPrice > currentPrice && (
          <span className="text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
            -{Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)}%
          </span>
        )}
      </div>

      {/* Variants */}
      {variants.map((variant) => (
        <div key={variant.name} className="mt-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {variant.name}: <span className="text-gray-500 font-normal">{selectedVariants[variant.name]}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedVariants((prev) => ({ ...prev, [variant.name]: option.value }))}
                className={`px-4 py-2.5 border rounded-xl text-sm font-medium transition-all ${
                  selectedVariants[variant.name] === option.value
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                } ${option.stock === 0 ? "opacity-30 cursor-not-allowed line-through" : ""}`}
                disabled={option.stock === 0}
              >
                {option.value}
                {option.priceModifier > 0 && ` (+${formatPrice(option.priceModifier)})`}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity + Add to cart */}
      <div className="mt-8 flex items-center gap-3">
        <div className="flex items-center border border-gray-200 rounded-xl">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-gray-500 hover:text-gray-900 transition">
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-gray-500 hover:text-gray-900 transition">
            <Plus size={16} />
          </button>
        </div>

        <button
          onClick={addToCart}
          disabled={stock === 0}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 px-6 rounded-xl font-semibold text-[15px] hover:bg-gray-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          {stock === 0 ? "Rupture de stock" : "Ajouter au panier"}
        </button>

        <button
          onClick={toggleWishlist}
          className={`p-3.5 rounded-xl border transition-all ${
            wishlisted
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200"
          }`}
        >
          <Heart size={18} className={wishlisted ? "fill-red-500" : ""} />
        </button>
      </div>

      {/* Stock indicator */}
      {stock > 0 && stock <= 5 && (
        <p className="mt-3 text-sm text-amber-600 font-medium">
          Plus que {stock} en stock. Commandez vite !
        </p>
      )}

      {/* Reviews */}
      <ReviewSection productId={productId} />
    </>
  );
}
