"use client";

import { useState, useEffect } from "react";
import PromoPopupCard from "./PromoPopupCard";
import { getMarketing, type MarketingData } from "@/lib/marketingCache";

type PopupData = NonNullable<MarketingData["popup"]>;

const DISMISSED_KEY = "promo_popup_dismissed";
// Code déjà reçu : on ne le repropose plus, même lors d'une autre visite.
const CODE_RECU_KEY = "promo_popup_code_recu";

export default function PromoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà fermé dans cette session
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) || localStorage.getItem(CODE_RECU_KEY)) return;
    } catch {
      // Stockage indisponible (navigation privée) : on affiche quand même.
    }

    getMarketing().then((data) => {
      if (data.popup?.isActive && data.popup?.title) {
        setPopup(data.popup);
        // Jamais par-dessus le bandeau cookies : on attend que le visiteur
        // ait fait son choix, puis le délai réglé dans l'admin.
        const delai = (data.popup!.delay || 5) * 1000;
        const attendreCookies = () => {
          let choix: string | null = null;
          try {
            choix = localStorage.getItem("cookie_consent");
          } catch {
            choix = "indisponible";
          }
          if (choix) setTimeout(() => setVisible(true), delai);
          else setTimeout(attendreCookies, 1000);
        };
        attendreCookies();
      }
    });
  }, []);

  function close() {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  function codeRecu() {
    try {
      localStorage.setItem(CODE_RECU_KEY, "1");
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {}
  }

  // Échap ferme la pop-up, comme on s'y attend.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!popup || !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={close}
      />

      {/* Pop-up */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md">
          <PromoPopupCard popup={popup} onClose={close} onSent={codeRecu} />
        </div>
      </div>
    </>
  );
}
