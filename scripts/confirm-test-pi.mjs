// Outil de test : confirme un PaymentIntent avec une carte de test Stripe
// (pm_card_visa), pour simuler le paiement navigateur en ligne de commande.
// Usage: node scripts/confirm-test-pi.mjs <paymentIntentId>
import { readFileSync } from "node:fs";
import Stripe from "stripe";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const key = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY manquante");
  process.exit(1);
}
const pi = process.argv[2];
if (!pi) {
  console.error("Usage: node scripts/confirm-test-pi.mjs <pi_id>");
  process.exit(1);
}

const stripe = new Stripe(key);
const result = await stripe.paymentIntents.confirm(pi, {
  payment_method: "pm_card_visa",
  return_url: "https://example.com/return", // requis car le compte autorise les méthodes à redirection (carte test ne redirige pas)
});
console.log(JSON.stringify({ id: result.id, status: result.status, amount: result.amount }));
