import { connectDB } from "./db";
import SiteSettings from "@/models/SiteSettings";

/**
 * Disponibilite des trois canaux de vente du site.
 *
 * Le besoin est simple a formuler : quand Viji s'absente, plus personne ne doit
 * pouvoir payer pour un plat qu'elle ne cuisinera pas, un atelier qu'elle
 * n'animera pas, ni une box qu'elle n'expediera pas. Le reste du site (menu,
 * pages, blog, contact) continue de vivre normalement.
 *
 * Deux niveaux volontairement distincts :
 *   - `modeVacances` ferme les trois canaux d'un coup, sans toucher aux
 *     reglages individuels : au retour, un seul clic remet tout comme avant ;
 *   - les trois interrupteurs ferment un canal a la fois (ex. arreter le
 *     traiteur pendant deux jours en gardant les ateliers ouverts).
 *
 * Le verrou qui compte est cote serveur : chaque route de paiement interroge
 * cet etat AVANT de creer l'intention de paiement. Masquer un formulaire ne
 * ferme rien, une page laissee ouverte dans un onglet suffirait a le rouvrir.
 */

export type Canal = "traiteurEmporter" | "ateliers" | "boutique";

export interface Disponibilite {
  modeVacances: boolean;
  /** Message affiche aux visiteurs a la place du formulaire. */
  message: string;
  /** Date de reouverture annoncee, au format « YYYY-MM-DD ». Vide si aucune. */
  dateRetour: string;
  traiteurEmporter: boolean;
  ateliers: boolean;
  boutique: boolean;
}

export const DISPONIBILITE_PAR_DEFAUT: Disponibilite = {
  modeVacances: false,
  message: "",
  dateRetour: "",
  traiteurEmporter: true,
  ateliers: true,
  boutique: true,
};

const MESSAGE_PAR_DEFAUT: Record<Canal, string> = {
  traiteurEmporter:
    "Les commandes à emporter sont momentanément suspendues. Merci de votre compréhension, à très vite.",
  ateliers:
    "Les réservations d'ateliers sont momentanément suspendues. Merci de votre compréhension, à très vite.",
  boutique:
    "Les commandes en ligne sont momentanément suspendues. Merci de votre compréhension, à très vite.",
};

const TITRE_PAR_CANAL: Record<Canal, string> = {
  traiteurEmporter: "Commandes à emporter suspendues",
  ateliers: "Réservations suspendues",
  boutique: "Commandes suspendues",
};

let cached: Disponibilite | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 s : une fermeture doit prendre effet vite.

/** Etat courant des trois canaux, lu dans les reglages admin. */
export async function getDisponibilite(): Promise<Disponibilite> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached;

  let etat = { ...DISPONIBILITE_PAR_DEFAUT };
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().select("availability").lean();
    const a = settings?.availability;
    if (a) {
      etat = {
        modeVacances: a.vacationMode ?? false,
        message: a.message?.trim() || "",
        dateRetour: a.returnDate?.trim() || "",
        traiteurEmporter: a.traiteurEmporter ?? true,
        ateliers: a.ateliers ?? true,
        boutique: a.boutique ?? true,
      };
    }
  } catch (err) {
    // Base injoignable : on laisse le site ouvert plutot que de bloquer des
    // ventes a cause d'un incident technique. L'erreur reste visible en log.
    console.error("Lecture de la disponibilite impossible:", err);
  }

  cached = etat;
  cacheTime = Date.now();
  return etat;
}

/** Appele apres une sauvegarde des reglages pour reprendre le nouvel etat. */
export function invalidateDisponibiliteCache() {
  cached = null;
  cacheTime = 0;
}

export interface EtatCanal {
  ouvert: boolean;
  /** Titre du panneau affiche a la place du formulaire. */
  titre: string;
  /** Message affiche au visiteur (personnalise dans l'admin, ou generique). */
  message: string;
  /** Date de retour en clair (« mardi 9 septembre »), ou chaine vide. */
  retour: string;
}

/**
 * Etat d'un canal, pret a etre affiche. Le mode vacances prime sur les
 * interrupteurs individuels : c'est lui qui ferme tout d'un coup.
 */
export async function getEtatCanal(canal: Canal): Promise<EtatCanal> {
  const dispo = await getDisponibilite();
  const ouvert = !dispo.modeVacances && dispo[canal] !== false;

  return {
    ouvert,
    titre: TITRE_PAR_CANAL[canal],
    message: dispo.message || MESSAGE_PAR_DEFAUT[canal],
    retour: dispo.dateRetour ? libelleDateRetour(dispo.dateRetour) : "",
  };
}

/** Raccourci booleen pour les gardes des routes API. */
export async function canalOuvert(canal: Canal): Promise<boolean> {
  return (await getEtatCanal(canal)).ouvert;
}

/**
 * Message d'erreur renvoye par l'API quand un canal ferme recoit quand meme
 * une demande de paiement (onglet reste ouvert, requete forgee).
 */
export function messageCanalFerme(etat: EtatCanal): string {
  return etat.retour
    ? `${etat.message} Reprise des commandes le ${etat.retour}.`
    : etat.message;
}

/** « 2026-09-09 » devient « mardi 9 septembre ». Renvoie la valeur brute si illisible. */
export function libelleDateRetour(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return iso;
  }
}
