import { sendEmail } from "@/lib/resend";
import { getNotificationEmail } from "@/lib/notify";
import { buildAtelierCustomerEmail, getCoordonneesBoutique } from "@/lib/reservation-emails";

/** Ce qu'il faut d'une réservation pour décider et écrire la confirmation. */
export interface ReservationVirement {
  type: "atelier" | "traiteur";
  paymentMethod?: "carte" | "virement";
  status: string;
  reservationNumber: string;
  customerName: string;
  customerEmail?: string;
  atelierTitle?: string;
  sessionDate?: string;
  sessionLocation?: string;
  participants?: number;
  amount: number;
  promoCode?: string;
  discount?: number;
}

/**
 * Un atelier réglé par virement reste « En attente » jusqu'à ce que la boutique
 * voie l'argent arriver. Quand elle le passe en « Confirmée », le client doit
 * l'apprendre : sinon il ne sait jamais si son virement est bien passé.
 */
export function doitConfirmerVirement(avant: ReservationVirement, nouveauStatut: string): boolean {
  return (
    avant.type === "atelier" &&
    avant.paymentMethod === "virement" &&
    avant.status === "pending" &&
    nouveauStatut === "confirmed" &&
    !!avant.customerEmail
  );
}

/** Mail au client : virement bien reçu, place confirmée (même récapitulatif qu'un paiement par carte). */
export async function envoyerVirementRecu(r: ReservationVirement): Promise<boolean> {
  if (!r.customerEmail) return false;
  const titre = r.atelierTitle || "Atelier";
  const resultat = await sendEmail({
    to: r.customerEmail,
    subject: `Virement bien reçu : votre place est confirmée (${titre})`,
    html: buildAtelierCustomerEmail({
      reservationNumber: r.reservationNumber,
      name: r.customerName,
      sessionTitle: titre,
      sessionDate: r.sessionDate || "",
      sessionLocation: r.sessionLocation || undefined,
      participants: r.participants || 1,
      amount: r.amount,
      promo: r.promoCode ? { code: r.promoCode, discount: r.discount || 0 } : undefined,
      coordonnees: await getCoordonneesBoutique(),
    }),
    replyTo: await getNotificationEmail(),
    kind: "virement-recu",
    reference: r.reservationNumber,
  });
  return !!resultat;
}
