"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

/**
 * Bandeau affiché en haut du site quand le mode vacances est activé dans
 * l'admin. Il prévient le visiteur dès la page d'accueil, avant qu'il ne
 * remplisse un panier pour découvrir la fermeture au moment de payer.
 *
 * Composant client, comme le bandeau promo : les pages statiques du site
 * figeraient sinon l'état au moment du build, et le bandeau resterait affiché
 * (ou absent) jusqu'au déploiement suivant.
 */
export default function BandeauVacances() {
  const [texte, setTexte] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;

    fetch("/api/disponibilite")
      .then((r) => r.json())
      .then((data) => {
        if (annule || !data?.modeVacances) return;
        const message: string =
          data.message?.trim() || "Les commandes en ligne sont momentanément suspendues.";
        const retour: string = data.retour || "";
        setTexte(retour ? `${message} Reprise le ${retour}.` : message);
      })
      .catch(() => {
        // Silencieux : un bandeau d'information ne doit jamais casser la page.
      });

    return () => {
      annule = true;
    };
  }, []);

  if (!texte) return null;

  return (
    <div className="bg-[var(--brand-gold)] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2.5 text-center">
        <CalendarClock size={14} strokeWidth={1.75} className="shrink-0 opacity-90" />
        <p className="text-[13px] leading-snug">{texte}</p>
      </div>
    </div>
  );
}
