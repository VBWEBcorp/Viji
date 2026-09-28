import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Marketing from "@/models/Marketing";
import Subscriber from "@/models/Newsletter";
import { resoutPromo, libelleRemise } from "@/lib/promo";
import { sendCodePopup } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Un même email ne reçoit pas le code plus d'une fois par jour : la pop-up ne
// doit pas servir à bombarder la boîte d'un tiers.
const DELAI_RENVOI_MS = 24 * 60 * 60 * 1000;

// POST /api/marketing/code : le visiteur laisse son email dans la pop-up, il
// reçoit le code promo choisi dans l'admin (Marketing > Pop-up).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    // Anti-spam : champ caché rempli par les robots.
    if (body.website) return NextResponse.json({ ok: true });

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    await connectDB();

    const marketing = await Marketing.findOne().lean();
    const popup = marketing?.popup;
    if (!popup?.isActive || popup.mode !== "code" || !popup.promoCode) {
      return NextResponse.json(
        { error: "Cette offre n'est plus disponible." },
        { status: 400 }
      );
    }

    const promo = await resoutPromo(popup.promoCode, null);
    if (!promo.ok) {
      console.error(
        `Pop-up : le code ${popup.promoCode} n'est plus valable (${promo.error}).`
      );
      return NextResponse.json(
        { error: "Cette offre n'est plus disponible." },
        { status: 400 }
      );
    }

    // Inscription à la newsletter (la pop-up l'annonce), ou réactivation.
    let sub = await Subscriber.findOne({ email });
    if (!sub) {
      sub = await Subscriber.create({ email, source: "popup" });
    } else if (sub.status === "unsubscribed") {
      sub.status = "active";
    }

    if (
      sub.popupCodeSentAt &&
      Date.now() - sub.popupCodeSentAt.getTime() < DELAI_RENVOI_MS
    ) {
      await sub.save();
      return NextResponse.json({ ok: true, dejaEnvoye: true });
    }

    const envoi = await sendCodePopup({
      email,
      code: promo.promo.code,
      avantage: libelleRemise(promo.promo),
      validUntil: promo.promo.validUntil,
    });
    if (!envoi) {
      return NextResponse.json(
        { error: "L'envoi a échoué, réessayez dans un instant." },
        { status: 502 }
      );
    }

    sub.popupCodeSentAt = new Date();
    await sub.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/marketing/code error:", error);
    return NextResponse.json(
      { error: "L'envoi a échoué, réessayez dans un instant." },
      { status: 500 }
    );
  }
}
