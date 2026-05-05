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
  (selector: string): {
    MR_ParcelShopPicker: (opts: Record<string, unknown>) => void;
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
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const WIDGET_JS =
  "https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
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

export default function MondialRelayWidget({
  brandCode,
  postCode,
  country = "FR",
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        loadStylesheet(LEAFLET_CSS);
        await loadScript(JQUERY_SRC);
        await loadScript(LEAFLET_JS);
        await loadScript(WIDGET_JS);

        if (cancelled || initialized.current) return;
        if (!window.$ || !window.$.fn?.MR_ParcelShopPicker) {
          setError("Widget Mondial Relay indisponible");
          setLoading(false);
          return;
        }

        initialized.current = true;
        window
          .$("#MR-Widget-Container")
          .MR_ParcelShopPicker({
            Target: "#MR-Widget-Result",
            Brand: brandCode,
            Country: country,
            PostCode: postCode || "",
            ColLivMod: "24R",
            AllowedCountries: "FR,BE,LU,NL,ES",
            EnableGmap: false,
            DisplayMapInfo: true,
            ShowResultsOnMap: true,
            OnParcelShopSelected: (data: MondialRelayPoint) => {
              if (data && data.ID) onSelect(data);
            },
          });
        setLoading(false);
      } catch (e) {
        setError((e as Error).message);
        setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCode]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading && (
        <div className="p-4 text-sm text-gray-500">
          Chargement du selecteur de points relais...
        </div>
      )}
      <div
        id="MR-Widget-Container"
        ref={containerRef}
        style={{ minHeight: 500 }}
        className="rounded-lg overflow-hidden border"
      />
      <input type="hidden" id="MR-Widget-Result" />
    </div>
  );
}
