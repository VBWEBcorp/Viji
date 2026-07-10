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

/** Vrai si une clé secrète Stripe est configurée. */
export async function isStripeConfigured(): Promise<boolean> {
  const keys = await getApiKeys();
  return !!keys.stripeSecretKey;
}

/** Vrai si le secret de signature des webhooks Stripe (commandes) est configuré. */
export async function isWebhookConfigured(): Promise<boolean> {
  const keys = await getApiKeys();
  return !!keys.stripeWebhookSecret;
}

/** Vrai si le secret de signature du webhook carte cadeau est configuré. */
export async function isGiftCardWebhookConfigured(): Promise<boolean> {
  const keys = await getApiKeys();
  return !!keys.stripeGiftCardWebhookSecret;
}

/**
 * Vérifie et décode un événement webhook Stripe carte cadeau à partir du corps
 * BRUT de la requête et de l'en-tête de signature. Lève si la signature est
 * invalide (protège contre les faux appels qui n'émanent pas de Stripe).
 *
 * Utilise le secret DÉDIÉ au webhook carte cadeau (STRIPE_GIFTCARD_WEBHOOK_SECRET),
 * qui retombe sur le secret partagé si aucun secret dédié n'est configuré.
 */
export async function constructWebhookEvent(
  rawBody: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = await getStripe();
  const keys = await getApiKeys();
  if (!keys.stripeGiftCardWebhookSecret) {
    throw new Error("Secret webhook carte cadeau non configuré");
  }
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    keys.stripeGiftCardWebhookSecret
  );
}

/**
 * Crée un PaymentIntent pour l'achat d'une carte cadeau et renvoie le
 * client_secret (consommé par Stripe Elements côté front).
 *
 * `allow_redirects: 'never'` n'autorise que les moyens de paiement sans
 * redirection : pas de return_url à gérer, le paiement se confirme sur place.
 */
export async function createGiftCardPaymentIntent(
  amountEuros: number,
  metadata: Record<string, string> = {}
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = await getStripe();
  const pi = await stripe.paymentIntents.create({
    amount: Math.round(amountEuros * 100),
    currency: "eur",
    description: `Carte cadeau — ${amountEuros}€`,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata,
  });
  if (!pi.client_secret) {
    throw new Error("Stripe n'a pas renvoyé de client_secret");
  }
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
}

export type PaymentVerification = {
  ok: boolean;
  testMode: boolean;
  receiptUrl: string | null;
  reason?: string;
};

/**
 * Vérifie qu'un PaymentIntent a bien été payé pour le montant attendu (euros).
 * En mode test (pas de clé Stripe), accepte tout id au format `pi_...`.
 */
export async function verifyGiftCardPayment(
  paymentIntentId: string,
  amountEuros: number
): Promise<PaymentVerification> {
  const configured = await isStripeConfigured();

  if (!configured) {
    const ok =
      typeof paymentIntentId === "string" && paymentIntentId.startsWith("pi_");
    return {
      ok,
      testMode: true,
      receiptUrl: null,
      reason: ok ? undefined : "Identifiant de paiement de test invalide",
    };
  }

  const stripe = await getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });

  if (pi.status !== "succeeded") {
    return {
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: `Paiement non confirmé (${pi.status})`,
    };
  }

  // Anti-rejeu : on n'accepte que les paiements créés PAR notre flux carte
  // cadeau (marqués `kind: gift_card`), pas n'importe quel paiement réussi du
  // compte Stripe. Sinon un paiement encaissé pour un autre produit pourrait
  // être réutilisé pour générer une carte gratuite.
  if (pi.metadata?.kind !== "gift_card") {
    return {
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: "Ce paiement ne correspond pas à un achat de carte cadeau",
    };
  }

  if (pi.currency !== "eur") {
    return {
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: "Devise du paiement incorrecte",
    };
  }

  const expectedCents = Math.round(amountEuros * 100);
  // On compare au montant RÉELLEMENT encaissé (amount_received), pas seulement
  // au montant demandé à la création du PaymentIntent.
  if (pi.amount_received !== expectedCents) {
    return {
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: "Montant du paiement incorrect",
    };
  }

  const charge = pi.latest_charge as { receipt_url?: string } | null;
  return {
    ok: true,
    testMode: false,
    receiptUrl: charge?.receipt_url || null,
  };
}
