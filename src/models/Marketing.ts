import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketing extends Document {
  popup: {
    isActive: boolean;
    image: string;
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    delay: number; // secondes avant affichage
    /**
     * « lien » : le bouton mène à une page. « code » : le visiteur laisse son
     * email et reçoit `promoCode` dans sa boîte, à saisir au paiement.
     */
    mode: "lien" | "code";
    promoCode: string;
  };
  banner: {
    isActive: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    linkUrl: string;
    speed: number; // vitesse de défilement
  };
  updatedAt: Date;
}

const MarketingSchema = new Schema<IMarketing>(
  {
    popup: {
      isActive: { type: Boolean, default: false },
      image: { type: String, default: "" },
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      buttonText: { type: String, default: "En profiter" },
      buttonUrl: { type: String, default: "/kits/decouverte" },
      delay: { type: Number, default: 5 },
      mode: { type: String, enum: ["lien", "code"], default: "lien" },
      promoCode: { type: String, default: "", uppercase: true, trim: true },
    },
    banner: {
      isActive: { type: Boolean, default: false },
      text: { type: String, default: "" },
      backgroundColor: { type: String, default: "#111827" },
      textColor: { type: String, default: "#ffffff" },
      linkUrl: { type: String, default: "" },
      speed: { type: Number, default: 30 },
    },
  },
  { timestamps: true }
);

const Marketing: Model<IMarketing> =
  mongoose.models.Marketing ||
  mongoose.model<IMarketing>("Marketing", MarketingSchema);

export default Marketing;
