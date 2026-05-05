import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailTemplate extends Document {
  key: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  variables: string[]; // ex: ["customerName", "orderNumber", "total"]
  isActive: boolean;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    description: { type: String, required: true },
    variables: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EmailTemplateSchema.index({ key: 1 });

const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate ||
  mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;
