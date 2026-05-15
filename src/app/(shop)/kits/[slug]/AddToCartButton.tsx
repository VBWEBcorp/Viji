"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";
import { ShoppingCart, Minus, Plus, Truck, Store } from "lucide-react";

type DeliveryMethod = "mondial-relay" | "click-collect";

interface Props {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    image?: string;
  };
  /** Methods available. Default = both (kits). Pass ["click-collect"] only for traiteur. */
  methods?: DeliveryMethod[];
}

const METHOD_LABELS: Record<DeliveryMethod, { label: string; sub: string; Icon: typeof Truck }> = {
  "mondial-relay": { label: "Mondial Relay", sub: "Livraison en point relais", Icon: Truck },
  "click-collect": { label: "Click & Collect", sub: "Retrait à Vern-sur-Seiche", Icon: Store },
};

export default function AddToCartButton({ product, methods = ["mondial-relay", "click-collect"] }: Props) {
  const { addItem, loading } = useCart();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<DeliveryMethod>(methods[0]);

  async function handleAdd() {
    setBusy(true);
    const variant = METHOD_LABELS[method].label;
    const ok = await addItem(product._id, variant, qty);
    setBusy(false);
    if (ok) toast.success(`${product.name} ajouté au panier`);
    else toast.error("Impossible d'ajouter au panier");
  }

  return (
    <div className="space-y-4">
      {methods.length > 1 && (
        <fieldset>
          <legend className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
            Mode de récupération
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {methods.map((m) => {
              const { label, sub, Icon } = METHOD_LABELS[m];
              const active = method === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex items-start gap-2.5 p-3 border text-left transition ${
                    active
                      ? "border-[var(--brand-gold)] bg-[var(--brand-cream)]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon size={16} className={active ? "text-[var(--brand-gold)]" : "text-gray-500"} />
                  <span>
                    <span className={`block text-[12px] font-medium ${active ? "text-[var(--brand-gold)]" : "text-gray-900"}`}>
                      {label}
                    </span>
                    <span className="block text-[11px] text-gray-500">{sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {methods.length === 1 && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-cream)] text-[12px] text-[var(--brand-gold)]">
          <Store size={14} />
          {METHOD_LABELS[methods[0]].label} · {METHOD_LABELS[methods[0]].sub}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-200">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-11 flex items-center justify-center text-gray-500 hover:text-[var(--brand-gold)] transition"
            aria-label="Diminuer"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="w-9 h-11 flex items-center justify-center text-gray-500 hover:text-[var(--brand-gold)] transition"
            aria-label="Augmenter"
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={busy || loading}
          className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-white px-6 py-3 text-[12px] uppercase tracking-widest font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-50"
        >
          <ShoppingCart size={14} />
          {busy ? "Ajout..." : "Ajouter au panier"}
        </button>
      </div>
    </div>
  );
}
