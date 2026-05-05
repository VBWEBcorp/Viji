import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  description?: string;
  type: "percentage" | "fixed" | "free_shipping" | "buy_x_get_y";
  value: number; // pourcentage (ex: 10 = 10%) ou centimes (ex: 500 = 5€)
  buyQuantity?: number; // for buy_x_get_y: buy X
  getQuantity?: number; // for buy_x_get_y: get Y free
  minOrderAmount?: number; // centimes
  maxUses?: number;
  perCustomerLimit?: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  autoApply: boolean;
  applicableCategories?: mongoose.Types.ObjectId[];
  applicableProducts?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String },
    type: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping", "buy_x_get_y"],
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    buyQuantity: { type: Number, min: 1 },
    getQuantity: { type: Number, min: 1 },
    minOrderAmount: { type: Number, min: 0 },
    maxUses: { type: Number, min: 0 },
    perCustomerLimit: { type: Number, min: 0 },
    currentUses: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    autoApply: { type: Boolean, default: false },
    applicableCategories: [
      { type: Schema.Types.ObjectId, ref: "Category" },
    ],
    applicableProducts: [
      { type: Schema.Types.ObjectId, ref: "Product" },
    ],
  },
  { timestamps: true }
);

PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

const PromoCode: Model<IPromoCode> =
  mongoose.models.PromoCode ||
  mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);

export default PromoCode;
