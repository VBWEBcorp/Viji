/**
 * Fermeture des commandes a emporter.
 *
 * Tout est cuisine maison : entre la commande et le retrait, il faut du temps.
 * Le service du soir demarre a 19h, donc passe 17h on ne prend plus de commande
 * pour le jour meme. Le client peut toujours commander pour les jours suivants.
 *
 * Le calcul se fait a l'heure de Paris, jamais a l'heure de la machine :
 * Netlify tourne en UTC, et en ete un `new Date()` y bascule au lendemain des
 * 22h heure francaise — la fermeture tomberait deux heures trop tot.
 * Cote navigateur, l'horloge du visiteur n'est pas fiable non plus : c'est
 * l'heure envoyee par le serveur qui fait foi, l'ecran ne fait que la suivre.
 */

/** Derniere heure a laquelle on prend une commande pour le jour meme. */
export const HEURE_LIMITE = 17;

const FUSEAU = "Europe/Paris";

const FORMAT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** La date « YYYY-MM-DD » et l'heure telles qu'on les lit a Paris. */
export function maintenantAParis(now: Date = new Date()) {
  const parts = Object.fromEntries(
    FORMAT.formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    heure: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Decale une date « YYYY-MM-DD » de n jours, sans passer par le fuseau local. */
export function ajouteJours(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Est-il trop tard pour commander pour aujourd'hui ? */
export function commandesDuJourCloses(now: Date = new Date()): boolean {
  return maintenantAParis(now).heure >= HEURE_LIMITE;
}

/** Premiere date de retrait encore commandable. */
export function premiereDateRetrait(now: Date = new Date()): string {
  const { date } = maintenantAParis(now);
  return commandesDuJourCloses(now) ? ajouteJours(date, 1) : date;
}

/** Nom du jour en clair : « demain (mardi 25 aout) ». */
export function libelleJour(iso: string, now: Date = new Date()): string {
  const aujourdhui = maintenantAParis(now).date;
  const ecart = Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${aujourdhui}T00:00:00Z`)) / 86_400_000
  );
  const prefixe = ecart === 0 ? "aujourd'hui" : ecart === 1 ? "demain" : ecart === 2 ? "après-demain" : "";
  const [y, m, d] = iso.split("-").map(Number);
  const enClair = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)));
  return prefixe ? `${prefixe} (${enClair})` : enClair;
}

/**
 * Controle serveur. Renvoie le message d'erreur a afficher, ou null si la date
 * demandee est encore ouverte. C'est ce garde-fou qui compte : une page laissee
 * ouverte a 16h55 ne doit pas pouvoir passer commande a 17h05.
 */
export function verifieDateRetrait(
  pickupDate: string,
  now: Date = new Date()
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
    return "Date de retrait invalide.";
  }
  const mini = premiereDateRetrait(now);
  if (pickupDate >= mini) return null;

  return commandesDuJourCloses(now)
    ? `Les commandes d'aujourd'hui sont closes : nous prenons les dernières jusqu'à ${HEURE_LIMITE}h. Choisissez un retrait à partir de demain.`
    : "Cette date de retrait est déjà passée.";
}
