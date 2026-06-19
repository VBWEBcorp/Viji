import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Subscriber from "@/models/Newsletter";
import { sendCampaign } from "@/lib/newsletter";
import { isResendConfigured } from "@/lib/resend";

// POST /api/newsletter/campaign — envoie une campagne aux abonnés actifs (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!(await isResendConfigured())) {
      return NextResponse.json(
        {
          error:
            "L'envoi d'e-mails n'est pas configuré (clé Resend manquante dans les réglages).",
        },
        { status: 400 }
      );
    }

    const { subject, message } = await request.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "L'objet et le message sont obligatoires." },
        { status: 400 }
      );
    }

    await connectDB();
    const subs = await Subscriber.find({ status: { $ne: "unsubscribed" } })
      .select("email")
      .lean();
    const emails = subs.map((s) => s.email);

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "Aucun abonné actif à qui envoyer." },
        { status: 400 }
      );
    }

    const result = await sendCampaign(emails, subject.trim(), message);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Newsletter campaign error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
