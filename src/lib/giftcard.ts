import crypto from "node:crypto";
import mongoose, { ClientSession } from "mongoose";
import GiftCard, { IGiftCard } from "@/models/GiftCard";
import SiteSettings from "@/models/SiteSettings";
import { sendEmail } from "@/lib/resend";
import {
  generateGiftCardBuyerEmail,
  generateGiftCardRecipientEmail,
} from "@/components/emails/GiftCardEmail";

/**
 * Erreur métier carte cadeau, avec un statut HTTP exploitable par les routes.
 * 400 = donnée invalide / règle métier ; 404 = introuvable.
 */
export class GiftCardError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "GiftCardError";
    this.status = status;
  }
}

/** Bornes de montant (centimes) pour l'achat d'une carte cadeau */
export const GIFT_CARD_MIN_AMOUNT = 500; // 5 €
export const GIFT_CARD_MAX_AMOUNT = 50000; // 500 €

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I/O/0/1 pour la lisibilité

/** Génère un code au format GC-XXXX-XXXX */
function generateCode(): string {
  const bytes = crypto.randomBytes(8);
  const part = (offset: number) =>
    Array.from({ length: 4 }, (_, i) => CODE_CHARS[bytes[offset + i] % CODE_CHARS.length]).join("");
  return `GC-${part(0)}-${part(4)}`;
}

/** Génère un code unique garanti (vérifie l'absence de collision) */
async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await GiftCard.exists({ code });
    if (!exists) return code;
  }
  throw new Error("Impossible de générer un code carte cadeau unique");
}

/** Calcule la date d'expiration à partir des réglages (12 mois = 1 an par défaut) */
async function resolveExpiry(): Promise<Date | null> {
  const settings = await SiteSettings.findOne().select("giftCards").lean();
  // Par défaut 1 an de validité. `|| 12` rattrape aussi les anciens réglages
  // restés à 0 : la commerçante veut une validité d'un an sur toutes les cartes.
  const months = settings?.giftCards?.expiryMonths || 12;
  if (months <= 0) return null;
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

interface CreateGiftCardInput {
  initialAmount: number; // centimes
  purchasedBy?: { userId?: string; email?: string; name?: string };
  recipient?: { name?: string; email?: string; message?: string };
  stripePaymentIntentId?: string;
  stripeReceiptUrl?: string;
  source?: "online" | "admin";
}

/**
 * Crée une carte cadeau (achat en ligne ou création admin) et journalise la
 * transaction d'émission. Les emails ne sont PAS envoyés ici — l'appelant
 * décide quand (voir sendGiftCardEmails).
 */
export async function createGiftCard(
  data: CreateGiftCardInput,
  adminId?: string
): Promise<IGiftCard> {
  const code = await generateUniqueCode();
  const source = data.source || (adminId ? "admin" : "online");
  const expiresAt = await resolveExpiry();

  const giftCard = await GiftCard.create({
    code,
    initialAmount: data.initialAmount,
    balance: data.initialAmount,
    currency: "EUR",
    status: "active",
    purchasedBy: {
      ...(data.purchasedBy?.userId
        ? { userId: new mongoose.Types.ObjectId(data.purchasedBy.userId) }
        : {}),
      ...(data.purchasedBy?.email ? { email: data.purchasedBy.email } : {}),
      ...(data.purchasedBy?.name ? { name: data.purchasedBy.name } : {}),
    },
    recipient: data.recipient || {},
    ...(data.stripePaymentIntentId
      ? { stripePaymentIntentId: data.stripePaymentIntentId }
      : {}),
    ...(data.stripeReceiptUrl
      ? { stripeReceiptUrl: data.stripeReceiptUrl }
      : {}),
    ...(expiresAt ? { expiresAt } : {}),
    source,
    ...(adminId
      ? { createdByAdmin: new mongoose.Types.ObjectId(adminId) }
      : {}),
    transactions: [
      {
        type: "purchase",
        amount: data.initialAmount,
        balanceAfter: data.initialAmount,
        description:
          source === "admin" ? "Création manuelle (admin)" : "Achat en ligne",
      },
    ],
  });

  return giftCard;
}

/**
 * Vérifie le solde d'une carte (public). Auto-expire si la date est dépassée.
 * Lève une GiftCardError si la carte est introuvable ou inactive.
 */
export async function checkBalance(code: string) {
  const giftCard = await GiftCard.findOne({ code: code.toUpperCase().trim() });
  if (!giftCard) {
    throw new GiftCardError("Carte cadeau introuvable", 404);
  }

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
 * Débite atomiquement une carte cadeau pour une commande.
 * findOneAndUpdate conditionné sur le solde => pas de race condition.
 * `session` permet de participer à une transaction Mongo (rollback possible).
 */
export async function redeemForOrder(
  code: string,
  amount: number, // centimes
  orderId: mongoose.Types.ObjectId | string,
  orderNumber: string,
  session?: ClientSession
): Promise<IGiftCard> {
  const opts = session ? { session } : {};

  const giftCard = await GiftCard.findOneAndUpdate(
    {
      code: code.toUpperCase().trim(),
      status: "active",
      balance: { $gte: amount },
    },
    { $inc: { balance: -amount } },
    { new: true, ...opts }
  );

  if (!giftCard) {
    throw new GiftCardError(
      "Carte cadeau introuvable, inactive ou solde insuffisant"
    );
  }

  giftCard.transactions.push({
    type: "redemption",
    amount,
    balanceAfter: giftCard.balance,
    order: orderId as mongoose.Types.ObjectId,
    orderNumber,
    description: `Commande ${orderNumber}`,
    createdAt: new Date(),
  });

  if (giftCard.balance === 0) {
    giftCard.status = "used";
  }

  await giftCard.save(opts);
  return giftCard;
}

/**
 * Re-crédite une carte cadeau (remboursement d'une commande).
 * Pipeline d'update atomique pour éviter d'écraser des transactions concurrentes.
 */
export async function refundToGiftCard(
  giftCardId: mongoose.Types.ObjectId | string,
  amount: number,
  orderId: mongoose.Types.ObjectId | string,
  orderNumber: string
): Promise<IGiftCard | null> {
  const giftCard = await GiftCard.findByIdAndUpdate(
    giftCardId,
    [
      {
        $set: {
          balance: { $add: [{ $ifNull: ["$balance", 0] }, amount] },
          status: {
            $cond: [{ $eq: ["$status", "used"] }, "active", "$status"],
          },
        },
      },
      {
        $set: {
          transactions: {
            $concatArrays: [
              { $ifNull: ["$transactions", []] },
              [
                {
                  type: "refund",
                  amount,
                  balanceAfter: "$balance",
                  order: new mongoose.Types.ObjectId(String(orderId)),
                  orderNumber,
                  description: `Remboursement commande ${orderNumber}`,
                  createdAt: new Date(),
                },
              ],
            ],
          },
        },
      },
    ],
    { new: true }
  );

  return giftCard;
}

/** Annule une carte cadeau (admin) : statut cancelled + solde remis à 0 */
export async function cancelGiftCard(
  id: string,
  admin?: { id: string; name?: string }
): Promise<IGiftCard> {
  const giftCard = await GiftCard.findById(id);
  if (!giftCard) {
    throw new GiftCardError("Carte cadeau introuvable", 404);
  }
  if (giftCard.status === "cancelled") {
    throw new GiftCardError("Cette carte cadeau est déjà annulée");
  }

  giftCard.transactions.push({
    type: "cancellation",
    amount: giftCard.balance,
    balanceAfter: 0,
    description: "Annulation par admin",
    performedBy: admin
      ? {
          userId: new mongoose.Types.ObjectId(admin.id),
          name: admin.name,
        }
      : undefined,
    createdAt: new Date(),
  });
  giftCard.balance = 0;
  giftCard.status = "cancelled";
  await giftCard.save();
  return giftCard;
}

/**
 * Envoie les emails (acheteur + destinataire) une seule fois, puis marque
 * emailSent. Best-effort : un échec d'envoi ne fait pas planter le flux.
 */
export async function sendGiftCardEmails(giftCard: IGiftCard): Promise<void> {
  if (giftCard.emailSent) return;

  const settings = await SiteSettings.findOne().select("shopName giftCards").lean();
  const shopName = settings?.shopName || "Ma Boutique";
  const template = settings?.giftCards?.template;

  const buyerEmail = giftCard.purchasedBy?.email;
  if (buyerEmail) {
    try {
      await sendEmail({
        to: buyerEmail,
        subject: `Votre carte cadeau ${shopName}`,
        html: generateGiftCardBuyerEmail({ giftCard, shopName, template }),
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
      });
    } catch (err) {
      console.error("Gift card recipient email failed:", err);
    }
  }

  giftCard.emailSent = true;
  await giftCard.save();
}
