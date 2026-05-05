import Stripe from "stripe";
import { getApiKeys } from "./apikeys";

let stripeInstance: Stripe | null = null;
let lastKey = "";

export async function getStripe(): Promise<Stripe> {
  const keys = await getApiKeys();

  if (!keys.stripeSecretKey) {
    throw new Error(
      "Clé Stripe non configurée. Allez dans Admin → Paramètres → Clés API."
    );
  }

  // Recréer l'instance si la clé a changé
  if (!stripeInstance || lastKey !== keys.stripeSecretKey) {
    stripeInstance = new Stripe(keys.stripeSecretKey, {
      typescript: true,
    });
    lastKey = keys.stripeSecretKey;
  }

  return stripeInstance;
}

export async function getStripePublishableKey(): Promise<string> {
  const keys = await getApiKeys();
  return keys.stripePublishableKey;
}
