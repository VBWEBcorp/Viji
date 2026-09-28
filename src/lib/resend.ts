import { Resend } from "resend";
import { getApiKeys } from "./apikeys";
import { getNotificationEmail } from "./notify";
import { connectDB } from "./db";
import EmailLog from "@/models/EmailLog";

let resendInstance: Resend | null = null;
let lastKey = "";

/**
 * Écrit une ligne dans le journal des envois. Ne lève jamais : un incident de
 * journalisation ne doit pas empêcher un email de partir, ni faire échouer une
 * commande déjà payée.
 */
async function journalise(entree: {
  to: string;
  from: string;
  subject: string;
  status: "envoye" | "echec";
  error?: string;
  resendId?: string;
  kind?: string;
  reference?: string;
  html?: string;
}): Promise<void> {
  try {
    await connectDB();
    await EmailLog.create(entree);
  } catch (err) {
    console.error("Journalisation de l'email impossible:", err);
  }
}

async function getResend(): Promise<Resend | null> {
  const keys = await getApiKeys();

  if (!keys.resendApiKey) {
    console.warn("Clé Resend non configurée, emails désactivés");
    return null;
  }

  if (!resendInstance || lastKey !== keys.resendApiKey) {
    resendInstance = new Resend(keys.resendApiKey);
    lastKey = keys.resendApiKey;
  }

  return resendInstance;
}

/** Pièce jointe email (ex. PDF de la carte cadeau). `content` = base64. */
export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  attachments,
  kind,
  reference,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  /** Nature de l'envoi, reportée au journal (ex. « confirmation-atelier »). */
  kind?: string;
  /** Référence métier associée (numéro de réservation ou de commande). */
  reference?: string;
}) {
  const keys = await getApiKeys();
  const client = await getResend();

  if (!client) {
    await journalise({
      to,
      from: "",
      subject,
      status: "echec",
      error: "Aucune clé Resend configurée.",
      kind,
      reference,
    });
    return null;
  }

  // Le domaine d'expédition ne reçoit pas de courrier : sans adresse de
  // réponse, une réponse du client se perdrait. À défaut d'indication
  // explicite, elle part vers la boîte de la boutique.
  let adresseReponse = replyTo;
  if (!adresseReponse) {
    try {
      adresseReponse = await getNotificationEmail();
    } catch {
      adresseReponse = undefined;
    }
  }

  const result = await client.emails.send({
    from: keys.resendFromEmail,
    to,
    subject,
    html,
    ...(adresseReponse ? { replyTo: adresseReponse } : {}),
    ...(attachments && attachments.length
      ? {
          attachments: attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }
      : {}),
  });

  // Le SDK Resend ne lève pas d'exception : il renvoie { data, error }.
  // Sans ce contrôle, un envoi rejeté (domaine non vérifié, destinataire non
  // autorisé en mode test, etc.) passait silencieusement. On journalise l'échec
  // pour qu'il soit visible, sans pour autant faire planter le flux appelant
  // (ex. une réservation déjà payée ne doit pas échouer si l'email admin bounce).
  if (result.error) {
    console.error(
      `Resend a refusé l'email (to=${to}, from=${keys.resendFromEmail}):`,
      result.error
    );
    await journalise({
      to,
      from: keys.resendFromEmail,
      subject,
      status: "echec",
      error: result.error.message || String(result.error),
      kind,
      reference,
      html,
    });
    return null;
  }

  await journalise({
    to,
    from: keys.resendFromEmail,
    subject,
    status: "envoye",
    resendId: result.data?.id,
    kind,
    reference,
    html,
  });

  return result;
}

/** True si l'envoi d'e-mails est configuré (clé Resend présente). */
export async function isResendConfigured(): Promise<boolean> {
  const keys = await getApiKeys();
  return Boolean(keys.resendApiKey);
}

/**
 * Envoi de diagnostic : identique à `sendEmail`, mais REMONTE l'erreur au lieu
 * de la journaliser en silence.
 *
 * Raison d'être : tant qu'aucun domaine n'est vérifié chez Resend, l'adresse
 * d'expéditeur `onboarding@resend.dev` n'autorise l'envoi que vers l'adresse
 * du titulaire du compte. Tous les autres destinataires sont refusés avec un
 * 403, invisible depuis l'admin. Ce chemin-là existe pour rendre ce refus
 * lisible : on peut tester une vraie adresse et lire la réponse de Resend.
 */
export async function sendEmailDiagnostic({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; from: string; error?: string }> {
  const keys = await getApiKeys();
  const client = await getResend();

  if (!client) {
    return {
      ok: false,
      from: "",
      error:
        "Aucune clé Resend n'est enregistrée. Renseignez-la dans Réglages, onglet Clés API.",
    };
  }

  try {
    const result = await client.emails.send({
      from: keys.resendFromEmail,
      to,
      subject,
      html,
    });

    if (result.error) {
      const message = result.error.message || String(result.error);
      await journalise({
        to,
        from: keys.resendFromEmail,
        subject,
        status: "echec",
        error: message,
        kind: "test-admin",
        html,
      });
      return { ok: false, from: keys.resendFromEmail, error: message };
    }

    await journalise({
      to,
      from: keys.resendFromEmail,
      subject,
      status: "envoye",
      resendId: result.data?.id,
      kind: "test-admin",
      html,
    });
    return { ok: true, from: keys.resendFromEmail };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await journalise({
      to,
      from: keys.resendFromEmail,
      subject,
      status: "echec",
      error: message,
      kind: "test-admin",
      html,
    });
    return { ok: false, from: keys.resendFromEmail, error: message };
  }
}

/**
 * Envoi en masse via l'API batch de Resend (100 e-mails max par requête).
 * Chaque message porte son propre HTML (lien de désinscription personnalisé).
 * Ne lève jamais : renvoie le décompte envoyés / échecs.
 */
export async function sendBatchEmails(
  messages: { to: string; subject: string; html: string }[]
): Promise<{ sent: number; failed: number }> {
  const client = await getResend();
  if (!client) return { sent: 0, failed: messages.length };

  const keys = await getApiKeys();
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages
      .slice(i, i + 100)
      .map((m) => ({ from: keys.resendFromEmail, ...m }));
    try {
      const result = await client.batch.send(chunk);
      if (result.error) {
        failed += chunk.length;
        console.error("Resend batch a échoué:", result.error);
        // Une ligne de journal par lot, sans le HTML : une newsletter part vers
        // des centaines d'adresses, en tracer chacune noierait le journal.
        await journalise({
          to: `${chunk.length} destinataires`,
          from: keys.resendFromEmail,
          subject: chunk[0]?.subject || "Envoi en masse",
          status: "echec",
          error: result.error.message || String(result.error),
          kind: "envoi-en-masse",
        });
      } else {
        sent += chunk.length;
        await journalise({
          to: `${chunk.length} destinataires`,
          from: keys.resendFromEmail,
          subject: chunk[0]?.subject || "Envoi en masse",
          status: "envoye",
          kind: "envoi-en-masse",
        });
      }
    } catch (err) {
      failed += chunk.length;
      console.error("Resend batch exception:", err);
      await journalise({
        to: `${chunk.length} destinataires`,
        from: keys.resendFromEmail,
        subject: chunk[0]?.subject || "Envoi en masse",
        status: "echec",
        error: err instanceof Error ? err.message : String(err),
        kind: "envoi-en-masse",
      });
    }
  }

  return { sent, failed };
}
