"use client";

import { useState } from "react";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export interface AppliedPromo {
  code: string;
  discount: number; // centimes
  type: string;
  value: number;
}

/**
 * Remise à afficher quand le sous-total bouge après application du code
 * (un plat ajouté, un participant de plus). Même calcul que le serveur.
 */
export function remiseAffichee(promo: AppliedPromo | null, subtotal: number): number {
  if (!promo) return 0;
  let d = 0;
  if (promo.type === "percentage") d = Math.round(subtotal * (promo.value / 100));
  else if (promo.type === "fixed") d = promo.value;
  return Math.max(0, Math.min(d, subtotal));
}

/**
 * Saisie/application d'un code promo : boutique, traiteur à emporter et
 * ateliers. Valide via /api/promos/validate (remise calculée sur le
 * sous-total). L'application qui fait foi reste côté serveur, à la création
 * du paiement.
 *
 * Pas de <form> ici : le champ se place à l'intérieur des formulaires de
 * commande, et un formulaire imbriqué est interdit en HTML.
 */
export default function PromoCodeInput({
  subtotal,
  appliedPromo,
  onApply,
  onRemove,
  disabled,
}: {
  subtotal: number; // centimes
  appliedPromo: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!value.trim() || checking || disabled) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code invalide");
        return;
      }
      onApply({
        code: data.code,
        discount: data.discount,
        type: data.type,
        value: data.value,
      });
      setValue("");
    } catch {
      setError("Erreur de vérification");
    } finally {
      setChecking(false);
    }
  }

  if (appliedPromo) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/5">
        <div className="flex items-center gap-2 min-w-0">
          <Check size={14} className="text-[var(--brand-gold)] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-[12px] font-medium text-gray-900 truncate">{appliedPromo.code}</p>
            <p className="text-[11px] text-gray-500">
              {appliedPromo.type === "percentage"
                ? `-${appliedPromo.value} %`
                : `-${formatPrice(appliedPromo.discount)}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-50"
          aria-label="Retirer le code promo"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={value}
            onKeyDown={(e) => {
              // Entrée applique le code, sans envoyer la commande autour.
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase());
              if (error) setError(null);
            }}
            placeholder="Code promo"
            disabled={disabled || checking}
            className={`w-full pl-8 pr-2 py-2 text-sm border bg-white font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-300 focus:border-[var(--brand-gold)] focus:ring-0 outline-none transition ${
              error ? "border-red-400" : "border-gray-200"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || checking || disabled}
          className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] bg-[var(--brand-gold)] text-white hover:bg-[var(--brand-gold-dark)] disabled:opacity-50 transition flex items-center"
        >
          {checking ? <Loader2 size={14} className="animate-spin" /> : "OK"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
