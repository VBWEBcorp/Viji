"use client";

import { useEffect, useState } from "react";
import { Check, MapPin, X } from "lucide-react";
import MondialRelayWidget, { MondialRelayPoint } from "./MondialRelayWidget";

interface Props {
  brandCode: string;
  postCode?: string;
  value: MondialRelayPoint | null;
  onSelect: (point: MondialRelayPoint) => void;
}

/**
 * Sélecteur de point relais « comme les vrais sites » : on n'affiche pas le
 * widget brut (moche + déborde sur mobile). À la place :
 *  - un bouton clair quand rien n'est choisi,
 *  - une carte de confirmation lisible une fois le point sélectionné,
 *  - le widget Mondial Relay ouvert dans une modale (plein écran sur mobile).
 * Le widget n'est monté que quand la modale est ouverte (chargement à la demande).
 */
export default function MondialRelayPicker({
  brandCode,
  postCode,
  value,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);

  // Verrouille le scroll de la page quand la modale est ouverte.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fermeture à la touche Échap.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div>
      {value ? (
        // ── État sélectionné : carte de confirmation lisible ──────────────
        <div className="flex items-start gap-4 px-4 sm:px-5 py-4 border border-[var(--brand-gold)] bg-[var(--brand-cream)]/50">
          <span className="w-10 h-10 rounded-full border border-[var(--brand-gold)]/30 text-[var(--brand-gold)] flex items-center justify-center shrink-0">
            <MapPin size={16} strokeWidth={1.5} />
          </span>
          <div className="flex-1 min-w-0 text-[13px] leading-relaxed">
            <p className="font-serif text-[15px] text-gray-900">{value.Nom}</p>
            <p className="text-gray-600 mt-0.5">
              {value.Adresse1}
              {value.Adresse2 ? `, ${value.Adresse2}` : ""}
            </p>
            <p className="text-gray-600">
              {value.CP} {value.Ville}
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[var(--brand-gold)] border-b border-[var(--brand-gold)]/40 pb-0.5 hover:border-[var(--brand-gold)] transition"
            >
              Changer de point relais
            </button>
          </div>
          <Check size={16} strokeWidth={1.5} className="text-[var(--brand-gold)] shrink-0 mt-1" />
        </div>
      ) : (
        // ── État vide : bouton d'ouverture ────────────────────────────────
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-3 border border-dashed border-[var(--brand-gold)]/50 bg-[var(--brand-cream)]/30 px-6 py-6 text-[12px] uppercase tracking-[0.25em] text-[var(--brand-gold-dark)] hover:bg-[var(--brand-cream)]/60 hover:border-[var(--brand-gold)] transition"
        >
          <MapPin size={18} strokeWidth={1.5} />
          Choisir un point relais
        </button>
      )}

      {/* ── Modale ──────────────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-0 z-[90] flex items-stretch sm:items-center justify-center sm:p-6 pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              className="pointer-events-auto bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-[var(--brand-gold)]/15 flex items-start justify-between shrink-0">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
                    Retrait
                  </p>
                  <h2 className="font-serif text-2xl text-gray-900 leading-none">
                    Choisissez votre point relais
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 -mr-2 -mt-1 text-gray-400 hover:text-[var(--brand-gold)] transition"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4">
                <MondialRelayWidget
                  brandCode={brandCode}
                  postCode={postCode}
                  onSelect={(p) => {
                    onSelect(p);
                    setOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
