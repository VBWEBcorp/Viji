import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockAlert extends Document {
  email: string;
  product: mongoose.Types.ObjectId;
  variant?: string;
  notified: boolean;
  createdAt: Date;
}

const StockAlertSchema = new Schema<IStockAlert>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: String },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StockAlertSchema.index({ product: 1, notified: 1 });
StockAlertSchema.index({ email: 1, product: 1 }, { unique: true });

const StockAlert: Model<IStockAlert> =
  mongoose.models.StockAlert || mongoose.model<IStockAlert>("StockAlert", StockAlertSchema);

export default StockAlert;
