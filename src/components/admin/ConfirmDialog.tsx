"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Boîte de dialogue de confirmation — charte « Entre Maman et Moi ».
 * Remplace le `window.confirm()` natif par une modale soignée et cohérente.
 *
 * Usage :
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Supprimer ?", danger: true }))) return;
 */

type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Accent rouge + icône d'alerte pour les actions destructrices. */
  danger?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm doit être utilisé dans un <ConfirmProvider>.");
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  // Échap pour annuler, focus auto sur le bouton de confirmation (Entrée
  // valide alors nativement via ce bouton, sans court-circuiter « Annuler »).
  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [options, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Voile */}
          <div
            onClick={() => close(false)}
            aria-hidden
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]"
          />

          {/* Carte */}
          <div className="relative w-full max-w-md bg-white border border-[var(--brand-gold)]/20 shadow-[0_24px_60px_-20px_rgba(60,40,15,0.35)] animate-[dialogIn_180ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className="px-7 pt-7 pb-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-full border flex items-center justify-center shrink-0",
                    options.danger
                      ? "border-red-200 text-red-500 bg-red-50"
                      : "border-[var(--brand-gold)]/30 text-[var(--brand-gold)] bg-[var(--brand-cream)]/70"
                  )}
                >
                  <AlertTriangle size={18} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 className="font-serif text-xl text-gray-900 leading-tight">
                    {options.title}
                  </h2>
                  {options.description && (
                    <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
                      {options.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-7 py-4 border-t border-[var(--brand-gold)]/12 bg-[var(--brand-cream)]/30">
              <button
                onClick={() => close(false)}
                className="inline-flex items-center justify-center border border-[var(--brand-gold)]/25 text-gray-600 text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 hover:text-[var(--brand-gold)] hover:border-[var(--brand-gold)]/50 transition"
              >
                {options.cancelLabel || "Annuler"}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => close(true)}
                className={cn(
                  "inline-flex items-center justify-center text-white text-[11px] uppercase tracking-[0.25em] font-medium px-4 py-2.5 transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  options.danger
                    ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300"
                    : "bg-[var(--brand-gold)] hover:bg-[var(--brand-gold-dark)] focus-visible:ring-[var(--brand-gold)]/40"
                )}
              >
                {options.confirmLabel || (options.danger ? "Supprimer" : "Confirmer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
