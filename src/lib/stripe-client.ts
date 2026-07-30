"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Chargement de Stripe.js côté navigateur avec la clé publique servie par le
 * serveur (`/api/stripe/config`), et non plus avec une variable injectée au
 * build.
 *
 * Pourquoi : la clé publique du front et la clé secrète du serveur venaient de
 * deux sources indépendantes. Rien ne garantissait qu'elles désignent le même
 * compte ni le même mode — une prod pouvait tourner en test sans qu'aucun
 * signal ne l'indique. Ici les deux viennent de `getApiKeys()`, donc des mêmes
 * réglages, et une correction dans l'admin s'applique sans redéploiement.
 */

let cached: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (cached) return cached;

  cached = (async () => {
    try {
      const res = await fetch("/api/stripe/config");
      const data = await res.json();
      if (data?.publishableKey) return loadStripe(data.publishableKey);
    } catch (err) {
      console.error("Configuration Stripe indisponible:", err);
    }

    // Repli sur la clé injectée au build, pour les déploiements qui n'ont pas
    // encore renseigné les clés dans l'admin.
    const fallback = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return fallback ? loadStripe(fallback) : null;
  })();

  return cached;
}

/**
 * Version hook. `stripePromise` vaut null tant que la clé n'est pas récupérée
 * (`<Elements>` accepte null et se met à jour ensuite) ; `stripeUnavailable`
 * ne passe à true que si aucune clé n'a pu être trouvée — c'est lui qui doit
 * déclencher le message d'erreur, jamais l'attente du chargement.
 */
export function useStripePromise() {
  // Initialiseur paresseux : le chargement démarre au premier rendu client,
  // comme le faisait l'ancien `loadStripe()` au niveau module. Côté serveur on
  // garde null, `<Elements>` s'en accommode.
  const [stripePromise] = useState<Promise<Stripe | null> | null>(() =>
    typeof window === "undefined" ? null : getStripePromise()
  );
  const [stripeUnavailable, setStripeUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    stripePromise?.then((stripe) => {
      if (!stripe && !cancelled) setStripeUnavailable(true);
    });
    return () => {
      cancelled = true;
    };
  }, [stripePromise]);

  return { stripePromise, stripeUnavailable };
}
