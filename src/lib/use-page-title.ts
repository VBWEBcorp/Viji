"use client";

import { useEffect } from "react";

/**
 * Met à jour le titre de l'onglet du navigateur pour les pages client (qui
 * ne peuvent pas exporter de `metadata` Next.js). Le suffixe « | Entre Maman
 * et Moi » est ajouté pour cohérence avec le template défini dans layout.tsx.
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | Entre Maman et Moi`;
  }, [title]);
}
