"use client";

import { useEffect, useRef, useState } from "react";

export interface MondialRelayPoint {
  ID: string;
  Nom: string;
  Adresse1: string;
  Adresse2?: string;
  CP: string;
  Ville: string;
  Pays: string;
}

interface Props {
  brandCode: string;
  postCode?: string;
  country?: string;
  onSelect: (point: MondialRelayPoint) => void;
}

interface JQueryFn {
  (selector: string | Element): {
    MR_ParcelShopPicker: (opts: Record<string, unknown>) => void;
    empty: () => void;
  };
  fn?: { MR_ParcelShopPicker?: unknown };
}

declare global {
  interface Window {
    $?: JQueryFn;
    jQuery?: JQueryFn;
    L?: unknown;
  }
}

const JQUERY_SRC = "https://code.jquery.com/jquery-3.6.0.min.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.7.1/dist/leaflet.js";
const WIDGET_JS =
  "https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js";

// Cache global pour ne charger les dépendances qu'une seule fois quel que soit
// le nombre de remontages du composant.
let depsPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-mr-src="${src}"]`
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Échec chargement ${src}`)),
        { once: true }
      );
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.mrSrc = src;
    s.addEventListener(
      "load",
      () => {
        s.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    s.addEventListener(
      "error",
      () => reject(new Error(`Échec chargement ${src}`)),
      { once: true }
    );
    document.head.appendChild(s);
  });
}

function loadStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function ensureDeps(): Promise<void> {
  if (depsPromise) return depsPromise;
  depsPromise = (async () => {
    loadStylesheet(LEAFLET_CSS);
    await loadScript(JQUERY_SRC);
    if (!window.jQuery && !window.$) {
      throw new Error("jQuery n'a pas pu être initialisé");
    }
    await loadScript(LEAFLET_JS);
    if (!window.L) {
      throw new Error("Leaflet n'a pas pu être initialisé");
    }
    await loadScript(WIDGET_JS);

    // Le script Mondial Relay s'enregistre parfois après onload.
    // On attend (jusqu'à 12s) que la fonction soit disponible sur $.fn.
    const start = Date.now();
    while (Date.now() - start < 12000) {
      if (window.$?.fn?.MR_ParcelShopPicker) return;
      await wait(50);
    }
    throw new Error(
      "Le plugin Mondial Relay n'a pas pu s'initialiser. Vérifiez que widget.mondialrelay.com n'est pas bloqué (extensions, pare-feu, AdBlock)."
    );
  })().catch((err) => {
    // En cas d'échec, on reset pour permettre un retry au prochain mount.
    depsPromise = null;
    throw err;
  });
  return depsPromise;
}

export default function MondialRelayWidget({
  brandCode,
  postCode,
  country = "FR",
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // On capture le postCode au montage uniquement. Sinon chaque frappe dans le
  // champ « Code postal » réinitialise le widget et perd la sélection en cours.
  // L'utilisateur peut modifier la zone de recherche via la barre intégrée au widget.
  const postCodeRef = useRef(postCode);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setError(null);
        setLoading(true);

        await ensureDeps();
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;

        // Reset complet du container pour éviter les doublons en hot-reload / Strict Mode.
        container.innerHTML = "";

        window
          .$!("#MR-Widget-Container")
          .MR_ParcelShopPicker({
            Target: "#MR-Widget-Result",
            Brand: brandCode,
            Country: country,
            PostCode: postCodeRef.current || "35770",
            ColLivMod: "24R",
            AllowedCountries: "FR,BE,LU,NL,ES",
            EnableGmap: false,
            DisplayMapInfo: true,
            ShowResultsOnMap: true,
            // Mode responsive natif du widget : liste + carte s'adaptent à la
            // largeur de l'écran au lieu d'imposer une mise en page « bureau ».
            Responsive: true,
            OnParcelShopSelected: (data: MondialRelayPoint) => {
              if (data && data.ID) onSelectRef.current(data);
            },
          });
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // brandCode et country : déclenchent une ré-initialisation si le marchand
    // change de code (rare). postCode est volontairement exclu : voir postCodeRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCode, country]);

  return (
    <div className="space-y-2">
      {loading && !error && (
        <div className="p-4 text-sm text-gray-500">
          Chargement de la carte des points relais…
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      <div
        id="MR-Widget-Container"
        ref={containerRef}
        style={{ minHeight: 500 }}
        className="max-w-full overflow-x-auto border border-gray-200"
      />
      <input type="hidden" id="MR-Widget-Result" />
    </div>
  );
}
