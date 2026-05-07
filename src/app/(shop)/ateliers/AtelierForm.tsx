"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

interface Props {
  productId?: string;
  productName: string;
}

export default function AtelierForm({ productId, productName }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [allergies, setAllergies] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) {
      toast.error("Atelier indisponible pour le moment");
      return;
    }
    setBusy(true);
    const ok = await addItem(productId, allergies.trim() || undefined, 1);
    if (ok) {
      toast.success(`${productName} ajouté au panier`);
      router.push("/checkout");
    } else {
      toast.error("Impossible d'ajouter au panier");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="allergies"
          className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3"
        >
          Allergies et intolérances
        </label>
        <textarea
          id="allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Précisez toute allergie, intolérance ou restriction alimentaire."
          rows={3}
          className="w-full px-0 py-2.5 bg-transparent border-0 border-b border-gray-200 text-[14px] text-gray-900 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition resize-none placeholder:text-gray-300"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[var(--brand-gold)] text-white px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition disabled:opacity-50"
      >
        {busy ? "Redirection…" : "Réserver et payer"}
        <ArrowRight size={13} />
      </button>
      <p className="font-serif italic text-[12px] text-gray-500 text-center sm:text-left">
        Paiement sécurisé en ligne (CB, Apple Pay, Google Pay)
      </p>
    </form>
  );
}
