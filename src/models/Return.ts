import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReturnItem {
  product: mongoose.Types.ObjectId;
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

export interface IReturn extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: IReturnItem[];
  status: "requested" | "approved" | "received" | "refunded" | "rejected";
  reason: string;
  adminNotes?: string;
  refundAmount: number;
  refundMethod: "original" | "store_credit";
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    variant: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [ReturnItemSchema],
    status: {
      type: String,
      enum: ["requested", "approved", "received", "refunded", "rejected"],
      default: "requested",
    },
    reason: { type: String, required: true },
    adminNotes: { type: String },
    refundAmount: { type: Number, default: 0, min: 0 },
    refundMethod: {
      type: String,
      enum: ["original", "store_credit"],
      default: "original",
    },
    tracking: {
      carrier: { type: String },
      trackingNumber: { type: String },
    },
  },
  { timestamps: true }
);

ReturnSchema.index({ order: 1 });
ReturnSchema.index({ user: 1 });
ReturnSchema.index({ status: 1 });

const Return: Model<IReturn> =
  mongoose.models.Return || mongoose.model<IReturn>("Return", ReturnSchema);

export default Return;
