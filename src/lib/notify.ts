import { connectDB } from "./db";
import SiteSettings from "@/models/SiteSettings";

/**
 * Adresse interne qui reçoit TOUTES les notifications de la boutique :
 * commandes, réservations traiteur, réservations d'atelier, cartes cadeaux,
 * messages du formulaire de contact.
 *
 * Ordre de priorité volontaire :
 *   1. Admin → Réglages → Email de contact (base de données)
 *   2. CONTACT_TO_EMAIL (variable d'environnement)
 *   3. adresse de repli codée en dur
 *
 * La base passe AVANT l'environnement : une variable d'hébergement mal réglée
 * (ou héritée d'un autre site) ne doit plus pouvoir détourner les notifications.
 * La destination reste ainsi pilotable depuis l'admin, sans redéploiement.
 */

const FALLBACK_EMAIL = "entremamanetmoicook@gmail.com";

/** Valeur par défaut du schéma SiteSettings : jamais une vraie destination. */
const PLACEHOLDER_EMAIL = "contact@example.com";

let cached: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute, comme le cache des clés API

export async function getNotificationEmail(): Promise<string> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached;

  let fromDb = "";
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().select("contactEmail").lean();
    const value = settings?.contactEmail?.trim() || "";
    if (value && value !== PLACEHOLDER_EMAIL) fromDb = value;
  } catch (err) {
    // Base injoignable : on retombe sur l'environnement plutôt que d'empêcher
    // l'envoi. L'erreur est journalisée pour rester visible.
    console.error("Lecture de l'email de notification impossible:", err);
  }

  cached = fromDb || process.env.CONTACT_TO_EMAIL || FALLBACK_EMAIL;
  cacheTime = Date.now();
  return cached;
}

/** Appelé après une sauvegarde des réglages pour reprendre la nouvelle adresse. */
export function invalidateNotificationEmailCache() {
  cached = null;
  cacheTime = 0;
}
