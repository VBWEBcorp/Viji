import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Subscriber from "@/models/Newsletter";
import { sendNewsletterWelcome } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter — inscription à la newsletter (public)
export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!clean || !EMAIL_RE.test(clean)) {
      return NextResponse.json(
        { error: "Adresse e-mail invalide." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email: clean });
    if (existing) {
      // Réactive un ancien désabonné, sinon ne crée pas de doublon.
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        await existing.save();
      }
      return NextResponse.json({ ok: true, alreadySubscribed: true });
    }

    await Subscriber.create({
      email: clean,
      source: typeof source === "string" && source ? source : "site",
    });

    // Mail de bienvenue — best-effort : un échec d'envoi (ou l'absence de
    // configuration Resend) ne doit jamais faire échouer l'inscription.
    try {
      await sendNewsletterWelcome(clean);
    } catch (err) {
      console.error("Newsletter welcome email failed:", err);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "L'inscription a échoué, veuillez réessayer." },
      { status: 500 }
    );
  }
}

// GET /api/newsletter — liste des abonnés (admin uniquement)
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await connectDB();
    const subscribers = await Subscriber.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json(subscribers, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Newsletter list error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
