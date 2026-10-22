import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import SiteSettings from "@/models/SiteSettings";
import { invalidateApiKeysCache } from "@/lib/apikeys";
import { invalidateNotificationEmailCache } from "@/lib/notify";
import { invalidateDisponibiliteCache } from "@/lib/disponibilite";
import { invalidateCoordonneesCache } from "@/lib/reservation-emails";

/**
 * Ce qu'un visiteur a le droit de lire. La page de paiement a besoin des
 * tarifs, de la TVA et des clés PUBLIQUES ; jamais des clés secrètes Stripe,
 * Resend ou Sendcloud, ni des coordonnées bancaires. Avant ce filtre, la route
 * renvoyait tout à n'importe qui, clé secrète Stripe comprise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function versionPublique(s: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { apiKeys, invoice, analytics, ...reste } = s;
  return {
    ...reste,
    analytics: {
      googleAnalyticsId: analytics?.googleAnalyticsId || "",
      plausibleDomain: analytics?.plausibleDomain || "",
      metaPixelId: analytics?.metaPixelId || "",
    },
    apiKeys: {
      stripePublishableKey: apiKeys?.stripePublishableKey || "",
      mondialRelayBrandCode: apiKeys?.mondialRelayBrandCode || "",
    },
  };
}

// GET /api/settings : tout pour l'admin connecté, la version publique sinon.
export async function GET() {
  try {
    await connectDB();
    let settings = await SiteSettings.findOne().lean();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const session = await auth().catch(() => null);
    if (session?.user?.role === "admin") return NextResponse.json(settings);
    return NextResponse.json(versionPublique(settings));
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    let settings = await SiteSettings.findOne();

    if (settings) {
      Object.assign(settings, body);
      await settings.save();
    } else {
      settings = await SiteSettings.create(body);
    }

    // Invalider les caches dérivés des réglages : une fermeture décidée dans
    // l'admin doit prendre effet tout de suite, pas au bout d'une minute.
    invalidateApiKeysCache();
    invalidateNotificationEmailCache();
    invalidateDisponibiliteCache();
    invalidateCoordonneesCache();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
