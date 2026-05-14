"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getMarketing, type MarketingData } from "@/lib/marketingCache";

type PopupData = NonNullable<MarketingData["popup"]>;

const DISMISSED_KEY = "promo_popup_dismissed";

export default function PromoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà fermé dans cette session
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) return;

    getMarketing().then((data) => {
      if (data.popup?.isActive && data.popup?.title) {
        setPopup(data.popup);
        setTimeout(() => setVisible(true), (data.popup!.delay || 5) * 1000);
      }
    });
  }, []);

  function close() {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!popup || !visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={close}
      />

      {/* Pop-up */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full relative transform transition-all duration-300 scale-100">
          {/* Close */}
          <button
            onClick={close}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition"
          >
            <X size={16} />
          </button>

          {/* Image */}
          {popup.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={popup.image}
              alt={popup.title}
              className="w-full h-52 object-cover"
            />
          )}

          {/* Contenu */}
          <div className="p-7 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{popup.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{popup.description}</p>
            <a
              href={popup.buttonUrl || "/kits/decouverte"}
              onClick={close}
              className="block w-full bg-gray-900 text-white py-3.5 rounded-xl text-[15px] font-semibold hover:bg-gray-800 transition-colors text-center"
            >
              {popup.buttonText || "En profiter"}
            </a>
            <button
              onClick={close}
              className="mt-3 text-[13px] text-gray-400 hover:text-gray-600 transition"
            >
              Non merci
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
