"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const COOKIE_NAME = "cookie_consent";

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
      // Small delay to avoid flash on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function acceptAll() {
    const consent: ConsentState = { necessary: true, analytics: true, marketing: true };
    setConsent(consent);
    setVisible(false);
  }

  function rejectAll() {
    const consent: ConsentState = { necessary: true, analytics: false, marketing: false };
    setConsent(consent);
    setVisible(false);
  }

  function savePreferences() {
    const consent: ConsentState = { necessary: true, analytics, marketing };
    setConsent(consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">
                Nous respectons votre vie privée
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                Ce site utilise des cookies pour améliorer votre expérience. Vous pouvez choisir
                les cookies que vous acceptez.
              </p>
            </div>
            <button
              onClick={rejectAll}
              className="p-1 text-gray-300 hover:text-gray-500 transition shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <span className="text-[13px] font-medium text-gray-700">Nécessaires</span>
                  <p className="text-[11px] text-gray-400">
                    Panier, authentification, sécurité
                  </p>
                </div>
                <input type="checkbox" checked disabled className="w-4 h-4 rounded" />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <span className="text-[13px] font-medium text-gray-700">Analytiques</span>
                  <p className="text-[11px] text-gray-400">
                    Google Analytics, statistiques de visite
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <span className="text-[13px] font-medium text-gray-700">Marketing</span>
                  <p className="text-[11px] text-gray-400">
                    Facebook Pixel, publicites ciblées
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={acceptAll}
              className="flex-1 bg-gray-900 text-white text-[13px] font-medium py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Tout accepter
            </button>
            {showDetails ? (
              <button
                onClick={savePreferences}
                className="flex-1 border border-gray-200 text-gray-700 text-[13px] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Sauvegarder
              </button>
            ) : (
              <button
                onClick={() => setShowDetails(true)}
                className="flex-1 border border-gray-200 text-gray-700 text-[13px] font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Personnaliser
              </button>
            )}
            <button
              onClick={rejectAll}
              className="text-[13px] text-gray-400 hover:text-gray-600 transition px-3 py-2.5"
            >
              Refuser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
