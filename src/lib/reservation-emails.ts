import { connectDB } from "./db";
import SiteSettings from "@/models/SiteSettings";
import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  emailInfoBox,
  emailDivider,
  EMAIL_COLORS,
  esc,
} from "./email-layout";

/**
 * Emails de confirmation envoyés au CLIENT après une réservation payée
 * (atelier ou Click & Collect).
 *
 * Jusqu'ici, ces deux parcours n'envoyaient qu'un seul email : la notification
 * interne à la boutique. Le client, lui, payait puis lisait sur l'écran de
 * confirmation qu'un récapitulatif lui avait été envoyé, sans rien recevoir.
 * D'où des appels du type « je n'ai pas eu de mail ». Ces deux fonctions
 * fournissent le message qui manquait, dans la même charte que les emails de
 * commande boutique.
 */

const C = EMAIL_COLORS;
const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Coordonnées de repli si les réglages admin sont vides ou injoignables. */
const ADRESSE_PAR_DEFAUT = "3 rue de la Libération, 35770 Vern-sur-Seiche";

export interface CoordonneesBoutique {
  adresse: string;
  telephone: string;
}

let cached: CoordonneesBoutique | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000;

/** Adresse et téléphone affichés en bas des emails clients. */
export async function getCoordonneesBoutique(): Promise<CoordonneesBoutique> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached;

  let adresse = "";
  let telephone = "";
  try {
    await connectDB();
    const settings = await SiteSettings.findOne()
      .select("address contactPhone")
      .lean();
    adresse = settings?.address?.trim() || "";
    telephone = settings?.contactPhone?.trim() || "";
  } catch (err) {
    console.error("Lecture des coordonnées boutique impossible:", err);
  }

  cached = { adresse: adresse || ADRESSE_PAR_DEFAUT, telephone };
  cacheTime = Date.now();
  return cached;
}

/** À appeler après une sauvegarde des réglages. */
export function invalidateCoordonneesCache() {
  cached = null;
  cacheTime = 0;
}

function formatEUR(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function ligne(label: string, valeur: string, fort = false): string {
  return `<tr>
    <td style="padding:7px 0; font-family:${SANS}; font-size:14px; color:${C.muted};">${label}</td>
    <td style="padding:7px 0; font-family:${SANS}; font-size:14px; text-align:right; color:${fort ? C.ink : C.body}; font-weight:${fort ? 700 : 400};">${valeur}</td>
  </tr>`;
}

function blocCoordonnees(coord: CoordonneesBoutique): string {
  return emailInfoBox(
    `<p style="font-family:${SANS}; font-size:13px; line-height:1.7; color:${C.body}; margin:0;">
      <strong style="color:${C.ink};">Une question ?</strong><br>
      ${esc(coord.adresse)}${coord.telephone ? `<br><a href="tel:${esc(coord.telephone.replace(/\s/g, ""))}" style="color:${C.gold}; text-decoration:none;">${esc(coord.telephone)}</a>` : ""}
      <br>Répondez simplement à cet email, il arrive directement chez nous.
    </p>`
  );
}

function blocNote(titre: string, texte: string): string {
  return emailInfoBox(
    `<p style="font-family:${SANS}; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:${C.muted}; margin:0 0 8px;">${esc(titre)}</p>
     <p style="font-family:${SANS}; font-size:14px; line-height:1.7; color:${C.body}; margin:0; white-space:pre-wrap;">${esc(texte)}</p>`
  );
}

/** Confirmation d'une réservation d'atelier payée, envoyée au participant. */
export function buildAtelierCustomerEmail(params: {
  reservationNumber: string;
  name: string;
  sessionTitle: string;
  sessionDate: string;
  sessionLocation?: string;
  participants: number;
  amount: number;
  notes?: string;
  coordonnees: CoordonneesBoutique;
}): string {
  const {
    reservationNumber,
    name,
    sessionTitle,
    sessionDate,
    sessionLocation,
    participants,
    amount,
    notes,
    coordonnees,
  } = params;

  return emailShell({
    title: `Votre réservation ${esc(sessionTitle)}`,
    preheader: `${sessionDate} · ${participants} participant${participants > 1 ? "s" : ""} · paiement reçu`,
    content:
      emailEyebrow("Réservation confirmée") +
      emailHeading(esc(sessionTitle)) +
      emailParagraph(
        `Bonjour <strong style="color:${C.ink};">${esc(name)}</strong>, votre place est réservée et votre paiement bien reçu. Voici le récapitulatif à conserver.`
      ) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;">` +
      ligne("Date", esc(sessionDate), true) +
      (sessionLocation ? ligne("Lieu", esc(sessionLocation)) : "") +
      ligne("Participants", String(participants)) +
      ligne("Montant réglé", formatEUR(amount), true) +
      ligne("N° de réservation", esc(reservationNumber)) +
      `</table>` +
      emailDivider() +
      (notes ? blocNote("Ce que vous nous avez indiqué", notes) : "") +
      emailParagraph(
        `Un empêchement ? Prévenez-nous au plus tôt, nous trouverons une solution ensemble.`
      ) +
      blocCoordonnees(coordonnees),
  });
}

/** Confirmation d'une commande Click & Collect payée, envoyée au client. */
export function buildTraiteurCustomerEmail(params: {
  reservationNumber: string;
  name: string;
  pickupDate: string;
  pickupTime: string;
  lines: { name: string; quantity: number; unitPrice: number }[];
  total: number;
  comment?: string;
  coordonnees: CoordonneesBoutique;
}): string {
  const {
    reservationNumber,
    name,
    pickupDate,
    pickupTime,
    lines,
    total,
    comment,
    coordonnees,
  } = params;

  const platsHtml = lines
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.ink};">${esc(i.name)}</td>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.body}; text-align:center; width:50px;">${i.quantity}</td>
          <td style="padding:10px 0; border-bottom:1px solid ${C.hairline}; font-family:${SANS}; font-size:14px; color:${C.ink}; text-align:right; width:90px; font-weight:600;">${formatEUR(i.unitPrice * i.quantity)}</td>
        </tr>`
    )
    .join("");

  return emailShell({
    title: `Votre commande à emporter ${esc(reservationNumber)}`,
    preheader: `Retrait le ${pickupDate} à ${pickupTime} · paiement reçu`,
    content:
      emailEyebrow("Commande confirmée") +
      emailHeading("Votre Click &amp; Collect") +
      emailParagraph(
        `Bonjour <strong style="color:${C.ink};">${esc(name)}</strong>, votre commande est réglée. Tout sera prêt pour le retrait indiqué ci-dessous.`
      ) +
      emailInfoBox(
        `<p style="font-family:${SANS}; font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:${C.muted}; margin:0 0 8px;">Retrait</p>
         <p style="font-family:${SANS}; font-size:15px; line-height:1.7; color:${C.ink}; margin:0; font-weight:600;">${esc(pickupDate)} · ${esc(pickupTime)}</p>
         <p style="font-family:${SANS}; font-size:14px; line-height:1.7; color:${C.body}; margin:6px 0 0;">${esc(coordonnees.adresse)}</p>`
      ) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 6px;">${platsHtml}</table>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
      ligne("Montant réglé", formatEUR(total), true) +
      ligne("N° de commande", esc(reservationNumber)) +
      `</table>` +
      emailDivider() +
      (comment ? blocNote("Votre commentaire", comment) : "") +
      blocCoordonnees(coordonnees),
  });
}
