"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function CartDrawer() {
  const { items, total, itemCount, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">
            Mon panier {itemCount > 0 && <span className="text-gray-400 text-sm font-normal">({itemCount})</span>}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingCart size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium mb-1">Votre panier est vide</p>
            <p className="text-sm text-gray-400 mb-6">
              Découvrez nos produits et ajoutez-les a votre panier.
            </p>
            <button
              onClick={closeCart}
              className="text-sm text-gray-900 font-medium hover:underline"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item._id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingCart size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium hover:underline line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>
                    )}
                    <p className="text-sm font-semibold mt-1">
                      {formatPrice(item.product.price)}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 space-y-3">
              {/* Free shipping progress */}
              <FreeShippingProgress total={total} />

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Sous-total</span>
                <span className="text-lg font-bold">{formatPrice(total)}</span>
              </div>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Commander <ArrowRight size={16} />
              </Link>

              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition py-1"
              >
                Voir le panier complet
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FreeShippingProgress({ total }: { total: number }) {
  const threshold = 5000; // 50 euros en centimes
  const progress = Math.min((total / threshold) * 100, 100);
  const remaining = threshold - total;

  if (total >= threshold) {
    return (
      <div className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-2 rounded-lg text-center">
        Livraison gratuite !
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>Plus que {formatPrice(remaining)} pour la livraison gratuite</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
