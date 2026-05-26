import mongoose, { Schema, Document, Model } from "mongoose";

export type GiftCardStatus = "active" | "used" | "expired" | "cancelled";
export type GiftCardSource = "online" | "admin";
export type GiftCardTxType =
  | "purchase"
  | "redemption"
  | "refund"
  | "cancellation";

export interface IGiftCardTransaction {
  type: GiftCardTxType;
  amount: number; // centimes
  balanceAfter: number; // centimes
  order?: mongoose.Types.ObjectId;
  orderNumber?: string;
  description?: string;
  performedBy?: {
    userId?: mongoose.Types.ObjectId;
    name?: string;
  };
  createdAt: Date;
}

export interface IGiftCard extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  initialAmount: number; // centimes
  balance: number; // centimes
  currency: string;
  status: GiftCardStatus;
  purchasedBy: {
    userId?: mongoose.Types.ObjectId;
    email?: string;
    name?: string;
  };
  recipient: {
    name?: string;
    email?: string;
    message?: string;
  };
  emailSent: boolean;
  stripePaymentIntentId?: string;
  stripeReceiptUrl?: string;
  expiresAt?: Date;
  transactions: IGiftCardTransaction[];
  source: GiftCardSource;
  createdByAdmin?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<IGiftCardTransaction>(
  {
    type: {
      type: String,
      enum: ["purchase", "redemption", "refund", "cancellation"],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    orderNumber: { type: String },
    description: { type: String },
    performedBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
      name: { type: String, default: null },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const GiftCardSchema = new Schema<IGiftCard>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    initialAmount: { type: Number, required: true, min: 0 }, // centimes
    balance: { type: Number, required: true, min: 0 }, // centimes
    currency: { type: String, default: "EUR", uppercase: true },
    status: {
      type: String,
      enum: ["active", "used", "expired", "cancelled"],
      default: "active",
    },
    purchasedBy: {
      userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
      email: { type: String, lowercase: true },
      name: { type: String },
    },
    recipient: {
      name: { type: String },
      email: { type: String, lowercase: true },
      message: { type: String },
    },
    emailSent: { type: Boolean, default: false },
    // Pas de default:null — sinon toutes les cartes sans paiement Stripe (créées
    // par l'admin) stockeraient null et se heurteraient à l'index unique.
    stripePaymentIntentId: { type: String },
    stripeReceiptUrl: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    transactions: { type: [TransactionSchema], default: [] },
    source: {
      type: String,
      enum: ["online", "admin"],
      default: "online",
    },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

GiftCardSchema.index({ status: 1 });
GiftCardSchema.index({ "purchasedBy.email": 1 });
GiftCardSchema.index({ "recipient.email": 1 });
GiftCardSchema.index({ expiresAt: 1 }, { sparse: true });
// Anti double-achat : un PaymentIntent ne peut créer qu'une seule carte cadeau.
// Index PARTIEL (et non sparse) : ne contraint que les vraies valeurs string,
// donc les cartes admin sans PI (champ absent) ne se gênent pas entre elles.
GiftCardSchema.index(
  { stripePaymentIntentId: 1 },
  {
    unique: true,
    partialFilterExpression: { stripePaymentIntentId: { $type: "string" } },
  }
);

const GiftCard: Model<IGiftCard> =
  mongoose.models.GiftCard ||
  mongoose.model<IGiftCard>("GiftCard", GiftCardSchema);

export default GiftCard;
