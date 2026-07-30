import { NextResponse } from "next/server";
import { getApiKeys } from "@/lib/apikeys";

// Toujours évalué à la requête : la clé vient des réglages en base, elle peut
// changer sans redéploiement.
export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/config
 *
 * Sert la clé publique Stripe au navigateur. Elle est publique par nature
 * (elle est de toute façon lisible dans le code côté client), mais la servir
 * depuis le serveur au lieu de l'injecter au build permet de la piloter depuis
 * Admin → Réglages → Clés API, et surtout garantit qu'elle provient de la même
 * source que la clé secrète : plus de front en test avec un serveur en live.
 */
export async function GET() {
  const keys = await getApiKeys();
  const publishableKey = keys.stripePublishableKey || "";

  return NextResponse.json({
    publishableKey,
    livemode: publishableKey.startsWith("pk_live_"),
  });
}
