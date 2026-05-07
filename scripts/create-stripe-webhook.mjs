import { readFileSync } from "node:fs";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SECRET = env.STRIPE_SECRET_KEY;
if (!SECRET) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

const URL = process.argv[2];
if (!URL) {
  console.error("Usage: node scripts/create-stripe-webhook.mjs https://your-site.netlify.app");
  process.exit(1);
}

const endpoint = `${URL.replace(/\/$/, "")}/api/webhooks/stripe`;
const events = ["payment_intent.succeeded", "payment_intent.payment_failed"];

const body = new URLSearchParams();
body.append("url", endpoint);
events.forEach((e) => body.append("enabled_events[]", e));
body.append("description", "Entre Maman et Moi — paiement");

const res = await fetch("https://api.stripe.com/v1/webhook_endpoints", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SECRET}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body,
});

const data = await res.json();

if (!res.ok) {
  console.error("Stripe API error:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("✓ Webhook créé sur Stripe.");
console.log("");
console.log("URL endpoint :", data.url);
console.log("Événements   :", data.enabled_events.join(", "));
console.log("");
console.log("STRIPE_WEBHOOK_SECRET=" + data.secret);
console.log("");
console.log("→ Colle cette ligne dans .env.local ET dans Netlify (Site settings → Environment variables).");
