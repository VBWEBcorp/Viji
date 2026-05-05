import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContent extends Document {
  key: string;
  type: "text" | "html" | "image" | "banner";
  title: string;
  value: string;
  metadata?: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    type: {
      type: String,
      enum: ["text", "html", "image", "banner"],
      required: true,
    },
    title: { type: String, required: true },
    value: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ContentSchema.index({ key: 1 });

const Content: Model<IContent> =
  mongoose.models.Content ||
  mongoose.model<IContent>("Content", ContentSchema);

export default Content;
