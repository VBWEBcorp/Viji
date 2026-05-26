import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  variant?: string;
  quantity: number;
  unitPrice: number; // centimes
}

export interface IOrderAddress {
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface IPickupPoint {
  id: string;
  name: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  carrier: "mondialrelay";
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  promoCode?: mongoose.Types.ObjectId;
  // Carte cadeau appliquée au paiement (réduit le montant prélevé par carte
  // bancaire ; ne modifie pas total/TVA). amount = centimes débités.
  giftCard?: {
    card: mongoose.Types.ObjectId;
    code: string;
    amount: number;
  };
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  shippingMethod: "home" | "pickup";
  pickupPoint?: IPickupPoint;
  paymentMethod: "stripe";
  paymentId?: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "returned";
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  sendcloudParcelId?: string;
  invoiceNumber?: string;
  invoiceIssuedAt?: Date;
  notes?: string;
  timeline: {
    action: string;
    details?: string;
    user?: mongoose.Types.ObjectId;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    variant: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: "FR" },
    phone: { type: String },
  },
  { _id: false }
);

const PickupPointSchema = new Schema<IPickupPoint>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true, default: "FR" },
    carrier: { type: String, enum: ["mondialrelay"], required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    promoCode: { type: Schema.Types.ObjectId, ref: "PromoCode" },
    giftCard: {
      type: new Schema(
        {
          card: { type: Schema.Types.ObjectId, ref: "GiftCard", required: true },
          code: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
        },
        { _id: false }
      ),
      default: undefined,
    },
    shippingAddress: { type: OrderAddressSchema, required: true },
    billingAddress: { type: OrderAddressSchema, required: true },
    shippingMethod: {
      type: String,
      enum: ["home", "pickup"],
      default: "home",
      required: true,
    },
    pickupPoint: { type: PickupPointSchema },
    paymentMethod: {
      type: String,
      enum: ["stripe"],
      required: true,
    },
    paymentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "returned"],
      default: "pending",
    },
    tracking: {
      carrier: { type: String },
      trackingNumber: { type: String },
      trackingUrl: { type: String },
    },
    sendcloudParcelId: { type: String },
    invoiceNumber: { type: String, index: true },
    invoiceIssuedAt: { type: Date },
    notes: { type: String },
    timeline: [
      {
        action: { type: String, required: true },
        details: { type: String },
        user: { type: Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ fulfillmentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
