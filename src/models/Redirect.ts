import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRedirect extends Document {
  fromPath: string;
  toPath: string;
  type: 301 | 302;
  createdAt: Date;
}

const RedirectSchema = new Schema<IRedirect>(
  {
    fromPath: { type: String, required: true, unique: true, trim: true },
    toPath: { type: String, required: true, trim: true },
    type: { type: Number, enum: [301, 302], default: 301 },
  },
  { timestamps: true }
);

RedirectSchema.index({ fromPath: 1 });

const Redirect: Model<IRedirect> =
  mongoose.models.Redirect || mongoose.model<IRedirect>("Redirect", RedirectSchema);

export default Redirect;
