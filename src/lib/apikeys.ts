import { connectDB } from "./db";
import SiteSettings from "@/models/SiteSettings";

interface ApiKeys {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  sendcloudPublicKey: string;
  sendcloudSecretKey: string;
  resendApiKey: string;
  resendFromEmail: string;
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
    sendcloudPublicKey:
      dbKeys.sendcloudPublicKey || process.env.SENDCLOUD_PUBLIC_KEY || "",
    sendcloudSecretKey:
      dbKeys.sendcloudSecretKey || process.env.SENDCLOUD_SECRET_KEY || "",
    resendApiKey: dbKeys.resendApiKey || process.env.RESEND_API_KEY || "",
    resendFromEmail:
      dbKeys.resendFromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      `${settings?.shopName || "Ma Boutique"} <noreply@${settings?.contactEmail?.split("@")[1] || "example.com"}>`,
  };

  cacheTime = Date.now();
  return cachedKeys;
}

// Invalider le cache quand on met à jour les settings
export function invalidateApiKeysCache() {
  cachedKeys = null;
  cacheTime = 0;
}
