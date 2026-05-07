"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
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
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[70] h-full w-full max-w-md bg-white flex flex-col transition-transform duration-500 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-[var(--brand-gold)]/15 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.45em] text-gray-400 mb-2">
              Votre sélection
            </p>
            <h2 className="font-serif text-3xl text-gray-900 leading-none">
              Panier
              {itemCount > 0 && (
                <span className="ml-3 font-serif italic text-2xl text-[var(--brand-gold)]/60">
                  {itemCount}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 -mt-1 text-gray-400 hover:text-[var(--brand-gold)] transition"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            {/* Halo or derrière le bol qui tourne */}
            <div className="relative w-40 h-40 md:w-44 md:h-44 mb-6 flex items-center justify-center">
              <span className="absolute inset-2 rounded-full border border-[var(--brand-gold)]/15" />
              <span className="absolute inset-6 rounded-full border border-[var(--brand-gold)]/20" />
              <div className="relative w-32 h-32 md:w-36 md:h-36 animate-spin-slow opacity-90 drop-shadow-md">
                <Image
                  src="https://i.ibb.co/cKKfhCLf/Bol-seul.png"
                  alt=""
                  fill
                  className="object-contain"
                  sizes="144px"
                />
              </div>
            </div>
            <p className="font-serif italic text-2xl text-gray-900 mb-2">
              Encore rien ici…
            </p>
            <p className="text-[13px] text-gray-500 mb-8 leading-relaxed max-w-xs">
              Découvrez les kits, ateliers et plats à emporter.
            </p>
            <button
              onClick={closeCart}
              className="text-[11px] uppercase tracking-[0.3em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-1 hover:border-[var(--brand-gold)] transition"
            >
              Continuer la visite
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 divide-y divide-[var(--brand-gold)]/10">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4 py-5 first:pt-0">
                  <div className="block w-20 h-24 bg-[var(--brand-cream)] overflow-hidden shrink-0">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={80}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--brand-gold)]/40">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[16px] text-gray-900 leading-tight line-clamp-2">
                      {item.product.name}
                    </p>
                    {item.variant && (
                      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[var(--brand-gold)]">
                        {item.variant}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-7 h-8 flex items-center justify-center text-gray-500 hover:text-[var(--brand-gold)] transition"
                          aria-label="Diminuer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-[12px] text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-7 h-8 flex items-center justify-center text-gray-500 hover:text-[var(--brand-gold)] transition"
                          aria-label="Augmenter"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <p className="text-[14px] text-gray-900">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item._id)}
                    className="self-start p-1 text-gray-300 hover:text-[var(--brand-gold)] transition"
                    aria-label="Retirer"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--brand-gold)]/15 px-6 sm:px-8 py-6 space-y-5">
              <FreeShippingProgress total={total} />

              <div className="flex items-end justify-between pt-2">
                <span className="text-[10px] uppercase tracking-[0.4em] text-gray-400">
                  Sous-total
                </span>
                <span className="font-serif text-2xl text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Frais de livraison & remises calculés à l'étape suivante.
              </p>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
              >
                Passer commande
                <ArrowRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FreeShippingProgress({ total }: { total: number }) {
  const threshold = 5000; // 50€ en centimes
  const progress = Math.min((total / threshold) * 100, 100);
  const remaining = threshold - total;

  if (total >= threshold) {
    return (
      <div className="text-center py-3 px-4 bg-[var(--brand-cream)] border border-[var(--brand-gold)]/30">
        <p className="font-serif italic text-[14px] text-[var(--brand-gold)]">
          Livraison offerte ✦
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-2 text-center">
        Plus que <span className="text-[var(--brand-gold)]">{formatPrice(remaining)}</span> pour la livraison offerte
      </p>
      <div className="w-full h-px bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-[var(--brand-gold)] transition-all duration-500"
          style={{ width: `${progress}%`, height: "1.5px" }}
        />
      </div>
    </div>
  );
}
