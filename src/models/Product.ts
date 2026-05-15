import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVariantOption {
  value: string;
  priceModifier: number;
  stock: number;
  sku?: string;
}

export interface IVariant {
  name: string;
  options: IVariantOption[];
}

export interface IProductImage {
  url: string;
  alt: string;
  order: number;
}

export interface ISupplier {
  name: string;
  email: string;
  apiUrl?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number; // en centimes
  compareAtPrice?: number; // prix barré en centimes
  category: mongoose.Types.ObjectId;
  images: IProductImage[];
  variants: IVariant[];
  stock: number;
  sku?: string;
  weight?: number; // en grammes
  fulfillmentType: "self" | "dropship";
  supplier?: ISupplier;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  /** Section dans une carte traiteur (Entrée, Plats, Boissons…). */
  section?: string;
  /** Ordre d'affichage dans la section (croissant). */
  sectionOrder?: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VariantOptionSchema = new Schema<IVariantOption>(
  {
    value: { type: String, required: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String },
  },
  { _id: true }
);

const VariantSchema = new Schema<IVariant>(
  {
    name: { type: String, required: true },
    options: [VariantOptionSchema],
  },
  { _id: true }
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [ProductImageSchema],
    variants: [VariantSchema],
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String },
    weight: { type: Number, min: 0 },
    fulfillmentType: {
      type: String,
      enum: ["self", "dropship"],
      default: "self",
    },
    supplier: {
      name: { type: String },
      email: { type: String },
      apiUrl: { type: String },
    },
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    section: { type: String, trim: true, index: true },
    sectionOrder: { type: Number, default: 0 },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ price: 1 });
ProductSchema.index({ tags: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
