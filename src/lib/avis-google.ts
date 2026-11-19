/**
 * Libellé du nombre d'avis Google affiché sur le site.
 * Le champ de l'admin (Pages → Accueil → Section « Avis Google ») accepte
 * « 21 avis » comme « 21 » : un nombre seul est complété par « avis ».
 */
export function libelleAvis(valeur: string): string {
  const v = (valeur || "").trim();
  return /^\d+$/.test(v) ? `${v} avis` : v;
}

/** Avis Google tel que la synchronisation quotidienne l'écrit (collection avis_google). */
export interface AvisGoogleDoc {
  auteur: string;
  note: number;
  texte: string;
  creeLe?: Date | string | null;
}

/** Avis affiché dans le bandeau de l'accueil (composant ReviewMarquee). */
export interface AvisAffiche {
  name: string;
  initial: string;
  when: string;
  body: string;
}

/** « il y a 5 jours », « il y a un mois »… comme sur Google. */
export function ilYA(date: Date, maintenant: Date = new Date()): string {
  const jours = Math.floor((maintenant.getTime() - date.getTime()) / 86_400_000);
  if (jours < 1) return "aujourd'hui";
  if (jours < 7) return jours === 1 ? "il y a un jour" : `il y a ${jours} jours`;
  if (jours < 30) {
    const s = Math.floor(jours / 7);
    return s === 1 ? "il y a une semaine" : `il y a ${s} semaines`;
  }
  if (jours < 365) {
    const m = Math.max(1, Math.floor(jours / 30.4));
    return m === 1 ? "il y a un mois" : `il y a ${m} mois`;
  }
  const a = Math.floor(jours / 365);
  return a === 1 ? "il y a un an" : `il y a ${a} ans`;
}

/** Raccourcit un avis long à la dernière phrase complète (même gabarit de carte). */
export function raccourcir(texte: string, max = 300): string {
  const t = texte.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const debut = t.slice(0, max);
  const fin = Math.max(debut.lastIndexOf(". "), debut.lastIndexOf("! "), debut.lastIndexOf("? "));
  if (fin > max * 0.4) return debut.slice(0, fin + 1);
  return debut.slice(0, debut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/**
 * Avis Google synchronisés → avis du bandeau : 4 et 5 étoiles avec un texte,
 * les plus récents d'abord. Liste vide si rien n'est synchronisé (l'accueil
 * garde alors ses avis en dur).
 */
export function avisPourAccueil(docs: AvisGoogleDoc[], max = 25, maintenant: Date = new Date()): AvisAffiche[] {
  return docs
    .filter((d) => d.note >= 4 && d.texte?.trim() && d.auteur?.trim())
    .sort((a, b) => new Date(b.creeLe || 0).getTime() - new Date(a.creeLe || 0).getTime())
    .slice(0, max)
    .map((d) => {
      const nom = d.auteur.trim();
      return {
        name: nom,
        initial: nom.charAt(0).toUpperCase(),
        when: d.creeLe ? ilYA(new Date(d.creeLe), maintenant) : "",
        body: raccourcir(d.texte),
      };
    });
}
