import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getApiKeys } from "@/lib/apikeys";
import EmailLog from "@/models/EmailLog";
import {
  verifieSignatureResend,
  STATUT_PAR_EVENEMENT,
  remplaceStatut,
} from "@/lib/resend-webhook";

/**
 * POST /api/webhooks/resend
 *
 * Resend previent ici du devenir de chaque message : remis, differe, rejete,
 * signale comme indesirable. C'est la seule facon de repondre a « la cliente
 * l'a-t-elle vraiment recu ? » : la reponse 200 de l'envoi dit uniquement que
 * Resend a pris le message en charge.
 *
 * A declarer sur resend.com/webhooks avec l'URL
 * https://entre-maman-et-moi.fr/api/webhooks/resend et les evenements
 * email.sent, email.delivered, email.delivery_delayed, email.bounced,
 * email.complained. Le secret `whsec_...` fourni va dans
 * Admin > Reglages > Cles API.
 */
export async function POST(req: NextRequest) {
  // Le corps brut est indispensable : la signature porte sur les octets recus,
  // pas sur le JSON reserialise.
  const corps = await req.text();

  const keys = await getApiKeys();
  const controle = verifieSignatureResend(
    corps,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    keys.resendWebhookSecret
  );

  if (!controle.valide) {
    console.error("Webhook Resend rejeté :", controle.raison);
    return NextResponse.json({ error: controle.raison }, { status: 400 });
  }

  let evenement: { type?: string; data?: { email_id?: string; reason?: string } };
  try {
    evenement = JSON.parse(corps);
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  const statut = evenement.type ? STATUT_PAR_EVENEMENT[evenement.type] : undefined;
  const emailId = evenement.data?.email_id;

  // Un evenement non suivi (ouverture, clic) n'est pas une erreur : on accuse
  // reception pour que Resend ne le rejoue pas indefiniment.
  if (!statut || !emailId) {
    return NextResponse.json({ ok: true, ignore: evenement.type ?? null });
  }

  try {
    await connectDB();
    const ligne = await EmailLog.findOne({ resendId: emailId }).select("delivery");

    if (!ligne) {
      // Message envoye avant la mise en place du journal, ou depuis un autre
      // outil : rien a rattacher, on ne cree pas de ligne orpheline.
      return NextResponse.json({ ok: true, inconnu: emailId });
    }

    if (remplaceStatut(ligne.delivery, statut)) {
      ligne.delivery = statut;
      ligne.deliveryAt = new Date();
      if (evenement.data?.reason) ligne.deliveryDetail = evenement.data.reason;
      await ligne.save();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/webhooks/resend error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
