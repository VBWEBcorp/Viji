import crypto from "node:crypto";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import GiftCard, {
  type IGiftCard,
  type GiftCardSource,
} from "@/models/GiftCard";
import SiteSettings from "@/models/SiteSettings";
import { verifyGiftCardPayment } from "@/lib/stripe";
import { sendEmail, type EmailAttachment } from "@/lib/resend";
import { getNotificationEmail } from "@/lib/notify";
import {
  emailShell,
  emailEyebrow,
  emailHeading,
  emailParagraph,
  esc,
} from "@/lib/email-layout";
import { renderGiftCardPdfBuffer } from "@/lib/giftcard-pdf";
import {
  generateGiftCardBuyerEmail,
  generateGiftCardRecipientEmail,
} from "@/components/emails/GiftCardEmail";

/** Erreur métier avec code HTTP (mappée par les API routes). */
export class GiftCardError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "GiftCardError";
    this.statusCode = statusCode;
  }
}

/** Montants proposés à l'achat en ligne (10 → 100 € par pas de 10). */
export const GIFT_CARD_PRESETS = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const;
export const MIN_AMOUNT = 5;
export const MAX_AMOUNT = 500;

/** Validité par défaut des cartes cadeaux : 1 an à compter de maintenant. */
function oneYearFromNow(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renvoie l'id s'il est un ObjectId valide, sinon `null`. Garde-fou : un admin
 * dont l'identifiant ne serait pas un ObjectId ne doit pas faire planter la
 * création d'une transaction (le nom lisible est conservé à part dans `name`).
 */
function objectIdOrNull(id: string | null | undefined): mongoose.Types.ObjectId | null {
  return id && mongoose.isValidObjectId(id)
    ? new mongoose.Types.ObjectId(id)
    : null;
}

/** Génère un code (format GC-XXXX-XXXX), sans I/O/0/1 pour la lisibilité. */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(8);
  const part = (offset: number) =>
    Array.from(
      { length: 4 },
      (_, i) => chars[bytes[offset + i] % chars.length]
    ).join("");
  return `GC-${part(0)}-${part(4)}`;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await GiftCard.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Impossible de générer un code unique après 10 tentatives");
}

function sourceDescription(source: GiftCardSource): string {
  const labels: Record<GiftCardSource, string> = {
    admin: "Création manuelle par admin",
    online: "Achat en ligne",
    on_site: "Vente sur place",
    avoir: "Avoir client",
    employee_benefit: "Avantage employé",
  };
  return labels[source] || "Création manuelle par admin";
}

type CreateData = {
  initialAmount: number; // euros
  source?: GiftCardSource;
  purchasedBy?: { userId?: string | null; email?: string; name?: string };
  recipient?: { name?: string; email?: string; message?: string };
  stripePaymentIntentId?: string | null;
  stripeReceiptUrl?: string | null;
  expiresAt?: Date | null;
  adminName?: string | null;
  /** Fond propre à cette carte (override de l'image globale). */
  imageUrl?: string | null;
};

export async function createGiftCard(
  data: CreateData,
  adminId: string | null = null
): Promise<IGiftCard> {
  await connectDB();
  const code = await generateUniqueCode();
  const source: GiftCardSource = data.source || (adminId ? "admin" : "online");

  const giftCard = await GiftCard.create({
    code,
    initialAmount: data.initialAmount,
    balance: data.initialAmount,
    currency: "EUR",
    status: "active",
    purchasedBy: {
      userId: objectIdOrNull(data.purchasedBy?.userId),
      email: data.purchasedBy?.email,
      name: data.purchasedBy?.name,
    },
    recipient: data.recipient || {},
    imageUrl: data.imageUrl || null,
    stripePaymentIntentId: data.stripePaymentIntentId || null,
    stripeReceiptUrl: data.stripeReceiptUrl || null,
    // Carte à usage unique, valable 1 an : expiration par défaut à +1 an.
    expiresAt: data.expiresAt || oneYearFromNow(),
    source,
    createdByAdmin: objectIdOrNull(adminId),
    transactions: [
      {
        type: "purchase",
        amount: data.initialAmount,
        balanceAfter: data.initialAmount,
        description: sourceDescription(source),
        performedBy: adminId
          ? { userId: objectIdOrNull(adminId), name: data.adminName || null }
          : undefined,
      },
    ],
  });

  // Emails (acheteur + destinataire) via Resend. Échec non bloquant : une carte
  // créée ne doit jamais être perdue parce qu'un email n'est pas parti.
  try {
    await sendGiftCardEmails(giftCard);
  } catch (err) {
    console.error("[giftcard] envoi emails échoué", (err as Error).message);
  }

  console.log(
    `[giftcard] créée ${code} — ${data.initialAmount}€ (source: ${source})`
  );
  return giftCard;
}

export async function getAllGiftCards(
  filters: { status?: string; search?: string } = {},
  pagination: { page?: number | string; limit?: number | string } = {}
) {
  await connectDB();
  const page = parseInt(String(pagination.page)) || 1;
  const limit = parseInt(String(pagination.limit)) || 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.search) {
    const escaped = escapeRegex(filters.search);
    query.$or = [
      { code: { $regex: escaped, $options: "i" } },
      { "purchasedBy.email": { $regex: escaped, $options: "i" } },
      { "recipient.email": { $regex: escaped, $options: "i" } },
      { "recipient.name": { $regex: escaped, $options: "i" } },
    ];
  }

  const [giftCards, total] = await Promise.all([
    GiftCard.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    GiftCard.countDocuments(query),
  ]);

  return {
    giftCards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function getGiftCardById(id: string): Promise<IGiftCard> {
  await connectDB();
  const giftCard = await GiftCard.findById(id);
  if (!giftCard) throw new GiftCardError("Carte cadeau introuvable", 404);
  return giftCard;
}

export async function checkBalance(code: string) {
  await connectDB();
  const giftCard = await GiftCard.findOne({ code: code.toUpperCase().trim() });
  if (!giftCard) throw new GiftCardError("Carte cadeau introuvable", 404);

  // Auto-expiration
  if (
    giftCard.expiresAt &&
    giftCard.expiresAt < new Date() &&
    giftCard.status === "active"
  ) {
    giftCard.status = "expired";
    await giftCard.save();
  }

  if (giftCard.status !== "active") {
    const label =
      giftCard.status === "used"
        ? "épuisée"
        : giftCard.status === "expired"
        ? "expirée"
        : "annulée";
    throw new GiftCardError(`Cette carte cadeau est ${label}`);
  }

  return {
    code: giftCard.code,
    balance: giftCard.balance,
    status: giftCard.status,
    expiresAt: giftCard.expiresAt,
  };
}

/**
 * Utilisation sur place (staff). Carte à USAGE UNIQUE : elle est consommée en
 * entier d'un coup (pas de débit partiel ni de solde réutilisable).
 * Le passage actif -> utilisé est atomique (filtre `status: 'active'`) pour
 * empêcher une double utilisation concurrente.
 */
export async function redeemOnSite(
  code: string,
  staffUser: { id: string; name: string },
  description: string | null = null
): Promise<IGiftCard> {
  await connectDB();
  const normalized = code.toUpperCase().trim();

  const card = await GiftCard.findOne({ code: normalized });
  if (!card) throw new GiftCardError("Carte cadeau introuvable", 404);

  // Auto-expiration avant utilisation.
  if (card.status === "active" && card.expiresAt && card.expiresAt < new Date()) {
    card.status = "expired";
    await card.save();
  }
  if (card.status !== "active") {
    const label =
      card.status === "used"
        ? "déjà utilisée"
        : card.status === "expired"
        ? "expirée"
        : "annulée";
    throw new GiftCardError(`Cette carte cadeau est ${label}`);
  }

  const value = card.balance;

  // Flip atomique actif -> utilisé : seule la 1re requête concurrente gagne.
  const giftCard = await GiftCard.findOneAndUpdate(
    { _id: card._id, status: "active" },
    {
      $set: { status: "used", balance: 0 },
      $push: {
        transactions: {
          type: "redemption_on_site",
          amount: value,
          balanceAfter: 0,
          description: description || "Utilisation sur place (usage unique)",
          performedBy: {
            userId: objectIdOrNull(staffUser.id),
            name: staffUser.name,
          },
          createdAt: new Date(),
        },
      },
    },
    { returnDocument: "after" }
  );

  if (!giftCard) {
    throw new GiftCardError("Cette carte cadeau vient d'être utilisée");
  }

  console.log(`[giftcard] utilisée (usage unique) ${giftCard.code} — ${value}€`);
  return giftCard;
}

export async function cancelGiftCard(
  id: string,
  adminUser: { id: string; name: string }
): Promise<IGiftCard> {
  await connectDB();
  const giftCard = await GiftCard.findById(id);
  if (!giftCard) throw new GiftCardError("Carte cadeau introuvable", 404);
  if (giftCard.status === "cancelled") {
    throw new GiftCardError("Cette carte cadeau est déjà annulée");
  }

  giftCard.transactions.push({
    type: "cancellation",
    amount: giftCard.balance,
    balanceAfter: 0,
    description: "Annulation par admin",
    performedBy: adminUser
      ? { userId: objectIdOrNull(adminUser.id), name: adminUser.name }
      : undefined,
    createdAt: new Date(),
  });
  giftCard.balance = 0;
  giftCard.status = "cancelled";
  await giftCard.save();

  console.log(`[giftcard] annulée ${giftCard.code} par ${adminUser?.name}`);
  return giftCard;
}

/**
 * Réactive une carte annulée par erreur. Restaure le solde qui avait été annulé
 * (montant de la dernière annulation) : carte de nouveau active si ce solde est
 * positif, sinon remise dans l'état « utilisée ».
 */
export async function reactivateGiftCard(
  id: string,
  adminUser: { id: string; name: string }
): Promise<IGiftCard> {
  await connectDB();
  const giftCard = await GiftCard.findById(id);
  if (!giftCard) throw new GiftCardError("Carte cadeau introuvable", 404);
  if (giftCard.status !== "cancelled") {
    throw new GiftCardError("Seule une carte annulée peut être réactivée");
  }

  // Solde restauré = montant voilé par la dernière annulation (sinon valeur initiale).
  const lastCancel = [...giftCard.transactions]
    .reverse()
    .find((t) => t.type === "cancellation");
  const restored = lastCancel ? lastCancel.amount : giftCard.initialAmount;

  giftCard.balance = restored;
  giftCard.status = restored > 0 ? "active" : "used";
  giftCard.transactions.push({
    type: "reactivation",
    amount: restored,
    balanceAfter: restored,
    description: "Réactivation (annulation corrigée)",
    performedBy: { userId: objectIdOrNull(adminUser.id), name: adminUser.name },
    createdAt: new Date(),
  });
  await giftCard.save();

  console.log(
    `[giftcard] réactivée ${giftCard.code} par ${adminUser?.name} — ${restored}€`
  );
  return giftCard;
}

type PurchaseData = {
  amount: number; // euros
  purchaser?: { name?: string; email?: string; userId?: string | null };
  recipient?: { name?: string; email?: string; message?: string };
};

/** Achat en ligne : vérifie le paiement Stripe (ou mode test) puis crée la carte. */
export async function purchaseGiftCard(
  data: PurchaseData,
  stripePaymentIntentId: string
): Promise<IGiftCard> {
  await connectDB();

  // Idempotence : un PaymentIntent ne crée qu'une seule carte. Si elle existe
  // déjà (re-soumission, retry réseau, ou un webhook qui aurait devancé le
  // client), on renvoie la carte existante au lieu d'échouer.
  const existing = await GiftCard.findOne({ stripePaymentIntentId });
  if (existing) return existing;

  const verification = await verifyGiftCardPayment(
    stripePaymentIntentId,
    data.amount
  );
  if (!verification.ok) {
    throw new GiftCardError(
      verification.reason || "Le paiement n'a pas pu être vérifié",
      402
    );
  }

  try {
    // expiresAt non fourni : createGiftCard applique la validité 1 an par défaut.
    return await createGiftCard({
      initialAmount: data.amount,
      source: "online",
      purchasedBy: data.purchaser || {},
      recipient: data.recipient || {},
      stripePaymentIntentId,
      stripeReceiptUrl: verification.receiptUrl,
    });
  } catch (err) {
    // Course entre deux requêtes concurrentes : l'index unique a bloqué la
    // seconde insertion (E11000). On renvoie alors la carte gagnante.
    if ((err as { code?: number }).code === 11000) {
      const winner = await GiftCard.findOne({ stripePaymentIntentId });
      if (winner) return winner;
    }
    throw err;
  }
}

/**
 * Envoie les emails (acheteur + destinataire) une seule fois, puis marque
 * emailSent. Best-effort : un échec d'envoi ne fait pas planter le flux.
 * Le visuel officiel (PDF recto/verso) est joint quand le rendu réussit.
 */
export async function sendGiftCardEmails(giftCard: IGiftCard): Promise<void> {
  if (giftCard.emailSent) return;

  const settings = await SiteSettings.findOne().select("shopName giftCards").lean();
  const shopName = settings?.shopName || "Ma Boutique";
  const template = settings?.giftCards?.template;

  // PDF joint (best-effort). Un échec de rendu ne bloque pas l'email : le code
  // et la validité figurent aussi en clair dans le corps du message.
  let attachments: EmailAttachment[] | undefined;
  try {
    const pdf = await renderGiftCardPdfBuffer({
      shopName,
      amount: giftCard.initialAmount,
      code: giftCard.code,
      recipientName: giftCard.recipient?.name,
      message: giftCard.recipient?.message,
      expiresAt: giftCard.expiresAt,
      template,
    });
    attachments = [
      {
        filename: `carte-cadeau-${giftCard.code}.pdf`,
        content: pdf.toString("base64"),
      },
    ];
  } catch (err) {
    console.error("[giftcard] rendu PDF carte échoué:", (err as Error).message);
  }

  const buyerEmail = giftCard.purchasedBy?.email;
  if (buyerEmail) {
    try {
      await sendEmail({
        to: buyerEmail,
        subject: `Votre carte cadeau ${shopName}`,
        html: generateGiftCardBuyerEmail({ giftCard, shopName, template }),
        attachments,
      });
    } catch (err) {
      console.error("Gift card buyer email failed:", err);
    }
  }

  const recipientEmail = giftCard.recipient?.email;
  if (recipientEmail) {
    try {
      await sendEmail({
        to: recipientEmail,
        subject: `Vous avez reçu une carte cadeau ${shopName} 🎁`,
        html: generateGiftCardRecipientEmail({ giftCard, shopName, template }),
        attachments,
        replyTo: buyerEmail || undefined,
      });
    } catch (err) {
      console.error("Gift card recipient email failed:", err);
    }
  }

  // Notification interne : la boutique est prévenue de chaque carte cadeau
  // vendue. Les montants des cartes sont en euros (pas en centimes).
  try {
    const amount = giftCard.initialAmount.toFixed(2).replace(".", ",");
    await sendEmail({
      to: await getNotificationEmail(),
      subject: `Carte cadeau vendue – ${giftCard.code} – ${amount} €`,
      html: emailShell({
        title: `Carte cadeau ${giftCard.code}`,
        preheader: `${amount} € · ${buyerEmail || "acheteur inconnu"}`,
        content:
          emailEyebrow("Carte cadeau vendue") +
          emailHeading(`${amount} €`) +
          emailParagraph(
            `Code <strong>${esc(giftCard.code)}</strong>` +
              (buyerEmail ? `<br>Acheteur : ${esc(buyerEmail)}` : "") +
              (recipientEmail ? `<br>Destinataire : ${esc(recipientEmail)}` : "")
          ),
      }),
      ...(buyerEmail ? { replyTo: buyerEmail } : {}),
    });
  } catch (err) {
    console.error("Gift card admin notification email failed:", err);
  }

  giftCard.emailSent = true;
  await giftCard.save();
}
