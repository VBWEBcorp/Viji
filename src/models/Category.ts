import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategoryFilter {
  name: string; // ex: "Taille", "Couleur", "Poids"
  type: "select" | "multiselect" | "range" | "color";
  options: string[]; // ex: ["XS","S","M","L","XL"] ou ["Rouge","Bleu"]
  unit?: string; // ex: "kg", "cm" — pour les ranges
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: mongoose.Types.ObjectId;
  order: number;
  isActive: boolean;
  filters: ICategoryFilter[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryFilterSchema = new Schema<ICategoryFilter>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["select", "multiselect", "range", "color"],
      default: "select",
    },
    options: [{ type: String, trim: true }],
    unit: { type: String, trim: true },
  },
  { _id: true }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    filters: [CategoryFilterSchema],
  },
  { timestamps: true }
);

CategorySchema.index({ parent: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
