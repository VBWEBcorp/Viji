import crypto from "node:crypto";

/**
 * Verification de signature des webhooks Resend (format Svix).
 *
 * Resend signe chaque appel avec trois en-tetes : `svix-id`, `svix-timestamp`
 * et `svix-signature`. La signature est un HMAC-SHA256 calcule sur la chaine
 * `id.timestamp.corps`, avec pour cle le secret `whsec_...` decode en base64.
 * L'en-tete peut contenir plusieurs signatures separees par des espaces
 * (rotation de secret) : il suffit qu'une seule corresponde.
 *
 * Sans cette verification, n'importe qui pourrait appeler l'URL du webhook et
 * ecrire de faux statuts de remise dans le journal, ce qui ferait exactement
 * l'inverse de ce qu'on cherche : donner une fausse certitude.
 */

/** Tolerance sur l'horodatage, contre le rejeu d'un ancien appel. */
const TOLERANCE_SECONDES = 5 * 60;

export interface EnTetesSvix {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export function verifieSignatureResend(
  corps: string,
  entetes: EnTetesSvix,
  secret: string,
  maintenant: Date = new Date()
): { valide: boolean; raison?: string } {
  if (!secret) return { valide: false, raison: "Secret de webhook non configuré." };

  const { id, timestamp, signature } = entetes;
  if (!id || !timestamp || !signature) {
    return { valide: false, raison: "En-têtes de signature manquants." };
  }

  const horodatage = Number(timestamp);
  if (!Number.isFinite(horodatage)) {
    return { valide: false, raison: "Horodatage illisible." };
  }
  const ecart = Math.abs(Math.floor(maintenant.getTime() / 1000) - horodatage);
  if (ecart > TOLERANCE_SECONDES) {
    return { valide: false, raison: "Appel trop ancien ou horodaté dans le futur." };
  }

  const cle = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const attendue = crypto
    .createHmac("sha256", cle)
    .update(`${id}.${timestamp}.${corps}`)
    .digest("base64");

  // « v1,<signature> v1,<autre> » : une correspondance suffit.
  const fournies = signature
    .split(" ")
    .map((partie) => partie.split(",").slice(1).join(","))
    .filter(Boolean);

  const attendueBuf = Buffer.from(attendue);
  const correspond = fournies.some((sig) => {
    const buf = Buffer.from(sig);
    // timingSafeEqual exige des longueurs egales : on ecarte avant de comparer.
    return buf.length === attendueBuf.length && crypto.timingSafeEqual(buf, attendueBuf);
  });

  return correspond
    ? { valide: true }
    : { valide: false, raison: "Signature invalide." };
}

/** Statut de remise stocke dans le journal, par type d'evenement Resend. */
export const STATUT_PAR_EVENEMENT: Record<
  string,
  "accepte" | "remis" | "differe" | "rejete" | "plainte"
> = {
  "email.sent": "accepte",
  "email.delivered": "remis",
  "email.delivery_delayed": "differe",
  "email.bounced": "rejete",
  "email.complained": "plainte",
};

/**
 * Un message peut passer par plusieurs etats. On ne redescend jamais d'un etat
 * definitif vers un etat provisoire : une fois « rejete » ou « remis », un
 * evenement « accepte » arrive en retard ne doit pas ecraser l'information.
 */
const RANG: Record<string, number> = {
  accepte: 1,
  differe: 2,
  remis: 3,
  rejete: 4,
  plainte: 5,
};

export function remplaceStatut(
  actuel: string | undefined,
  nouveau: string
): boolean {
  if (!actuel) return true;
  return (RANG[nouveau] ?? 0) >= (RANG[actuel] ?? 0);
}
