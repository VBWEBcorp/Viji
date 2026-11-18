/**
 * Libellé du nombre d'avis Google affiché sur le site.
 * Le champ de l'admin (Pages → Accueil → Section « Avis Google ») accepte
 * « 21 avis » comme « 21 » : un nombre seul est complété par « avis ».
 */
export function libelleAvis(valeur: string): string {
  const v = (valeur || "").trim();
  return /^\d+$/.test(v) ? `${v} avis` : v;
}
