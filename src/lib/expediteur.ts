/**
 * Resolution de l'adresse d'expedition des emails.
 *
 * Le piege que ce fichier existe pour neutraliser : `onboarding@resend.dev`
 * est l'adresse bac a sable de Resend. Elle n'ecrit qu'au titulaire du compte.
 * Configuree sur un site en production, elle donne exactement l'illusion la
 * plus couteuse : la commercante recoit ses notifications, donc tout parait
 * fonctionner, pendant qu'aucun client ne recoit jamais rien, et que les refus
 * restent invisibles.
 *
 * Ce reglage vit dans des variables d'hebergement qu'on ne relit jamais. On ne
 * lui fait donc pas confiance : une adresse bac a sable est ecartee et
 * remplacee par une adresse du domaine du site, qui, lui, est verifie.
 */

/** Domaines reserves aux essais chez Resend. */
const DOMAINES_BAC_A_SABLE = ["resend.dev"];

/** Extrait l'adresse d'un en-tete « Nom <adresse> », ou la renvoie telle quelle. */
export function extraitAdresse(entete: string): string {
  const entreChevrons = entete.match(/<([^>]+)>/);
  return (entreChevrons ? entreChevrons[1] : entete).trim().toLowerCase();
}

/** L'expediteur configure est-il une adresse d'essai incapable d'ecrire aux clients ? */
export function estExpediteurBacASable(entete: string): boolean {
  const domaine = extraitAdresse(entete).split("@")[1] || "";
  return DOMAINES_BAC_A_SABLE.some(
    (d) => domaine === d || domaine.endsWith(`.${d}`)
  );
}

/** « https://entre-maman-et-moi.fr/ » devient « entre-maman-et-moi.fr ». */
export function domaineDuSite(url: string): string {
  const nettoye = url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();

  // Une adresse locale ne peut pas servir de domaine d'expedition.
  if (!nettoye || !nettoye.includes(".") || /^(localhost|127\.|\[)/.test(nettoye)) {
    return "";
  }
  return nettoye;
}

/** Un nom d'expediteur ne doit pas casser l'en-tete From. */
function nomSur(nom: string): string {
  return nom.replace(/["<>,;]/g, "").trim() || "Boutique";
}

/**
 * Adresse d'expedition reellement utilisee.
 *
 * Ordre : la valeur configuree si elle est exploitable, sinon une adresse du
 * domaine du site, sinon la valeur configuree malgre tout (mieux vaut tenter
 * un envoi et voir l'echec dans le journal que ne rien envoyer du tout).
 */
export function resoudreExpediteur({
  configuree,
  nomBoutique,
  urlSite,
}: {
  configuree: string;
  nomBoutique: string;
  urlSite: string;
}): string {
  const valeur = configuree.trim();

  if (valeur && !estExpediteurBacASable(valeur)) return valeur;

  const domaine = domaineDuSite(urlSite);
  if (!domaine) return valeur;

  const remplacement = `${nomSur(nomBoutique)} <contact@${domaine}>`;

  if (valeur) {
    console.warn(
      `[email] Expéditeur « ${valeur} » ignoré : c'est l'adresse d'essai de ` +
        `Resend, elle n'écrit qu'au titulaire du compte et refuse tous les ` +
        `clients. Utilisation de « ${remplacement} ». Réglez l'adresse dans ` +
        `Admin > Réglages > Clés API pour faire taire cet avertissement.`
    );
  }

  return remplacement;
}
