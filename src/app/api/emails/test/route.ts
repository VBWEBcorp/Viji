import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendEmailDiagnostic } from "@/lib/resend";
import { getNotificationEmail } from "@/lib/notify";

const schema = z.object({
  to: z.string().email("Adresse email invalide"),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
});

/**
 * POST /api/emails/test
 *
 * Envoie reellement un email de test et renvoie la reponse de Resend, y compris
 * en cas de refus. Le bouton « Envoyer un test » de l'admin se contentait
 * jusqu'ici d'afficher un message de succes sans rien envoyer : impossible de
 * s'apercevoir que les emails aux clients etaient refuses.
 *
 * Reserve aux administrateurs : la route envoie du HTML fourni par l'appelant.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { to, subject, html } = schema.parse(await req.json());

    const resultat = await sendEmailDiagnostic({
      to,
      subject: `[Test] ${subject}`,
      html,
    });

    if (!resultat.ok) {
      return NextResponse.json(
        {
          error: resultat.error,
          from: resultat.from,
          // Piste de resolution la plus frequente : tant que le domaine n'est
          // pas verifie, seul le titulaire du compte Resend peut recevoir.
          indice: resultat.error?.includes("your own email address")
            ? "L'expéditeur actuel est l'adresse bac à sable de Resend : elle ne peut écrire qu'au titulaire du compte. Vérifiez le domaine du site sur resend.com/domains, puis remplacez l'adresse d'expéditeur dans Réglages, onglet Clés API."
            : undefined,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, to, from: resultat.from });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }
    console.error("POST /api/emails/test error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** GET : adresse proposée par défaut dans le champ de test. */
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ to: await getNotificationEmail() });
}
