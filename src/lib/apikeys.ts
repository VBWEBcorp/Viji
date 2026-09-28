import { connectDB } from "./db";
import SiteSettings from "@/models/SiteSettings";
import { resoudreExpediteur } from "./expediteur";

interface ApiKeys {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  // Secret de signature dédié au webhook carte cadeau (/api/gift-cards/webhook).
  // Permet d'enregistrer un endpoint Stripe distinct de celui des commandes.
  // À défaut, on retombe sur stripeWebhookSecret (comportement historique).
  stripeGiftCardWebhookSecret: string;
  sendcloudPublicKey: string;
  sendcloudSecretKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  resendWebhookSecret: string;
}

let cachedKeys: ApiKeys | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getApiKeys(): Promise<ApiKeys> {
  // Cache pour éviter de requêter la DB à chaque appel
  if (cachedKeys && Date.now() - cacheTime < CACHE_TTL) {
    return cachedKeys;
  }

  await connectDB();
  const settings = await SiteSettings.findOne().lean();
  const dbKeys = settings?.apiKeys || {};

  // DB en priorité, .env.local en fallback
  cachedKeys = {
    stripeSecretKey:
      dbKeys.stripeSecretKey || process.env.STRIPE_SECRET_KEY || "",
    stripePublishableKey:
      dbKeys.stripePublishableKey || process.env.STRIPE_PUBLISHABLE_KEY || "",
    stripeWebhookSecret:
      dbKeys.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || "",
    // Chaque destination Stripe possède SA propre clé de signature : le secret
    // dédié enregistré dans l'admin doit primer, sinon le webhook carte cadeau
    // vérifie les signatures avec le secret des commandes et rejette tout.
    // Le repli sur le secret partagé ne concerne que les installations à
    // endpoint unique, qui n'ont pas de secret dédié à fournir.
    stripeGiftCardWebhookSecret:
      dbKeys.stripeGiftCardWebhookSecret ||
      process.env.STRIPE_GIFTCARD_WEBHOOK_SECRET ||
      dbKeys.stripeWebhookSecret ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      "",
    sendcloudPublicKey:
      dbKeys.sendcloudPublicKey || process.env.SENDCLOUD_PUBLIC_KEY || "",
    sendcloudSecretKey:
      dbKeys.sendcloudSecretKey || process.env.SENDCLOUD_SECRET_KEY || "",
    resendApiKey: dbKeys.resendApiKey || process.env.RESEND_API_KEY || "",
    resendWebhookSecret:
      dbKeys.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET || "",
    // L'expéditeur ne se prend pas au mot : une adresse d'essai Resend est
    // écartée au profit du domaine du site, seul capable d'écrire aux clients.
    // Voir `src/lib/expediteur.ts`.
    resendFromEmail: resoudreExpediteur({
      configuree:
        dbKeys.resendFromEmail ||
        process.env.RESEND_FROM_EMAIL ||
        `${settings?.shopName || "Ma Boutique"} <noreply@${settings?.contactEmail?.split("@")[1] || "example.com"}>`,
      nomBoutique: settings?.shopName || "Ma Boutique",
      urlSite: process.env.NEXT_PUBLIC_APP_URL || "",
    }),
  };

  cacheTime = Date.now();
  return cachedKeys;
}

// Invalider le cache quand on met à jour les settings
export function invalidateApiKeysCache() {
  cachedKeys = null;
  cacheTime = 0;
}
