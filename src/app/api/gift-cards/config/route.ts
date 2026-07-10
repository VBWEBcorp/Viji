import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { GIFT_CARD_PRESETS, MIN_AMOUNT, MAX_AMOUNT } from "@/lib/giftcard";
import { isStripeConfigured, getStripePublishableKey } from "@/lib/stripe";

// La config Stripe/réglages peut changer : pas de cache.
export const dynamic = "force-dynamic";

// GET /api/gift-cards/config — config publique pour la page d'achat
export async function GET() {
  await connectDB();
  const [settings, stripeConfigured, stripePublishableKey] = await Promise.all([
    SiteSettings.findOne().select("giftCards shopName").lean(),
    isStripeConfigured(),
    getStripePublishableKey(),
  ]);

  return NextResponse.json({
    enabled: !!settings?.giftCards?.enabled,
    shopName: settings?.shopName || "Ma Boutique",
    template: settings?.giftCards?.template || null,
    presets: GIFT_CARD_PRESETS,
    min: MIN_AMOUNT,
    max: MAX_AMOUNT,
    stripeConfigured,
    stripePublishableKey,
  });
}
