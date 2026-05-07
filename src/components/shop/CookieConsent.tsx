"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_NAME = "cookie_consent";
const LOGO_SRC = "https://i.ibb.co/5WWqVbC2/cropped-Entre-Maman-Et-Moi-1.png";

function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COOKIE_NAME);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setConsent(consent: ConsentState) {
  localStorage.setItem(COOKIE_NAME, JSON.stringify(consent));
}

export function useCookieConsent() {
  const [consent, setConsentState] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsentState(getConsent());
  }, []);

  return consent;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function acceptAll() {
    setConsent({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  }

  function rejectAll() {
    setConsent({ necessary: true, analytics: false, marketing: false });
    setVisible(false);
  }

  function savePreferences() {
    setConsent({ necessary: true, analytics, marketing });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto bg-white border border-[var(--brand-gold)]/20 shadow-2xl shadow-black/15">
        {/* En-tête avec logo */}
        <div className="relative px-6 sm:px-8 pt-7 pb-5 border-b border-[var(--brand-gold)]/15 text-center">
          <button
            onClick={rejectAll}
            aria-label="Fermer (refuser tout)"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[var(--brand-gold)] transition"
          >
            <X size={16} strokeWidth={1.5} />
          </button>

          <Image
            src={LOGO_SRC}
            alt="Entre Maman et Moi"
            width={140}
            height={56}
            className="h-12 sm:h-14 w-auto object-contain mx-auto mb-4"
          />
          <p className="text-[10px] uppercase tracking-[0.4em] text-[var(--brand-gold)] mb-2">
            Vie privée
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-gray-900 leading-tight">
            On respecte votre choix
          </h3>
        </div>

        {/* Corps */}
        <div className="px-6 sm:px-8 pt-6 pb-7">
          <p className="font-serif italic text-[13px] md:text-[14px] text-gray-600 leading-relaxed text-center mb-6 max-w-md mx-auto">
            Ce site utilise quelques cookies pour assurer le panier, votre connexion et,
            si vous l&apos;acceptez, mesurer la fréquentation de manière anonyme.
          </p>

          {showDetails && (
            <div className="space-y-3 mb-6">
              <ConsentRow
                label="Nécessaires"
                description="Panier, connexion, sécurité — toujours actifs."
                checked
                disabled
              />
              <ConsentRow
                label="Mesure d'audience"
                description="Statistiques anonymes pour améliorer le site."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentRow
                label="Marketing"
                description="Personnalisation et publicités ciblées."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <button
              onClick={acceptAll}
              className="flex-1 bg-[var(--brand-gold)] text-white py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-gold-dark)] transition"
            >
              Tout accepter
            </button>
            {showDetails ? (
              <button
                onClick={savePreferences}
                className="flex-1 border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-cream)] transition"
              >
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 border border-[var(--brand-gold)]/40 text-[var(--brand-gold)] py-3.5 text-[11px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--brand-cream)] transition"
              >
                Personnaliser
              </button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-[11px]">
            <button
              onClick={rejectAll}
              className="text-gray-500 hover:text-[var(--brand-gold)] transition border-b border-transparent hover:border-[var(--brand-gold)]/40 pb-0.5"
            >
              Refuser tout
            </button>
            <span className="text-[var(--brand-gold)]/40">·</span>
            <Link
              href="/pages/politique-confidentialite"
              className="text-gray-500 hover:text-[var(--brand-gold)] transition border-b border-transparent hover:border-[var(--brand-gold)]/40 pb-0.5"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-between gap-4 px-4 py-3 border border-[var(--brand-gold)]/15 transition ${
        disabled ? "bg-[var(--brand-cream)]/40 cursor-not-allowed" : "cursor-pointer hover:border-[var(--brand-gold)]/40"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-900 font-medium">
          {label}
        </p>
        <p className="font-serif italic text-[12px] text-gray-500 mt-1">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 accent-[var(--brand-gold)] shrink-0"
      />
    </label>
  );
}
