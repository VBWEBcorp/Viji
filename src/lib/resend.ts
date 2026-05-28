import { Resend } from "resend";
import { getApiKeys } from "./apikeys";

let resendInstance: Resend | null = null;
let lastKey = "";

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

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const client = await getResend();
  if (!client) return null;

  const keys = await getApiKeys();

  const result = await client.emails.send({
    from: keys.resendFromEmail,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
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
    return null;
  }

  return result;
}
