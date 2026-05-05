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
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = await getResend();
  if (!client) return null;

  const keys = await getApiKeys();

  return client.emails.send({
    from: keys.resendFromEmail,
    to,
    subject,
    html,
  });
}
