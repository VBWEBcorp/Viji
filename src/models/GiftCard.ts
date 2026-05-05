import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGiftCard extends Document {
  code: string;
  initialAmount: number; // centimes
  balance: number; // centimes
  issuedBy?: mongoose.Types.ObjectId;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  isActive: boolean;
  expiresAt?: Date;
  usageHistory: {
    orderId: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GiftCardSchema = new Schema<IGiftCard>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialAmount: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    recipientEmail: { type: String, lowercase: true },
    recipientName: { type: String },
    message: { type: String },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usageHistory: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

GiftCardSchema.index({ code: 1 });
GiftCardSchema.index({ recipientEmail: 1 });
GiftCardSchema.index({ isActive: 1 });

const GiftCard: Model<IGiftCard> =
  mongoose.models.GiftCard || mongoose.model<IGiftCard>("GiftCard", GiftCardSchema);

export default GiftCard;
