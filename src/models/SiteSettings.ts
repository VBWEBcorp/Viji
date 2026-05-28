import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Document {
  shopName: string;
  shopLogo?: string;
  shopDescription?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  currency: string;
  shipping: {
    freeShippingThreshold?: number;
    defaultWeight?: number;
    homeDeliveryEnabled?: boolean;
    mondialRelayEnabled?: boolean;
    homeRate?: number; // centimes
    pickupRate?: number; // centimes
    homeFreeThreshold?: number; // centimes
    pickupFreeThreshold?: number; // centimes
  };
  tax: {
    rate?: number; // pourcentage (ex: 20 pour 20%)
    pricesIncludeTax?: boolean; // true = prix produits TTC, false = HT
    label?: string; // ex: "TVA"
  };
  giftCards: {
    enabled?: boolean; // active l'achat/utilisation des cartes cadeaux
    presets?: { amount: number; label?: string }[]; // montants suggérés (centimes)
    expiryMonths?: number; // durée de validité en mois (0 = sans expiration)
    // Template personnalisable de la carte cadeau (visuel web, email, PDF).
    template?: {
      logoUrl?: string;
      primaryColor?: string; // couleur d'accent (titres, montant)
      backgroundColor?: string; // fond de la carte
      backgroundImageUrl?: string; // image de fond optionnelle
      headline?: string; // titre affiché (ex: "Carte cadeau")
      footerText?: string; // petit texte en bas de carte
    };
  };
  invoice: {
    enabled?: boolean;
    prefix?: string; // ex: "FAC-"
    nextNumber?: number; // numéro séquentiel
    legalMention?: string; // mention légale en bas de facture
    iban?: string;
    bic?: string;
    bankName?: string;
  };
  analytics: {
    googleAnalyticsId?: string; // ex: G-XXXXXXX
    plausibleDomain?: string; // ex: maboutique.fr
    metaPixelId?: string;
    customHeadScript?: string; // HTML libre injecté dans <head>
  };
  integrations: {
    formspreeId?: string; // ex: xrgvozge
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  legal: {
    siret?: string;
    tva?: string;
    rcs?: string;
    capital?: string;
    legalForm?: string; // SARL, SAS, etc.
  };
  // API Keys (configurables depuis l'admin)
  apiKeys: {
    stripeSecretKey?: string;
    stripePublishableKey?: string;
    stripeWebhookSecret?: string;
    sendcloudPublicKey?: string;
    sendcloudSecretKey?: string;
    resendApiKey?: string;
    resendFromEmail?: string;
    mondialRelayBrandCode?: string;
  };
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    shopName: { type: String, required: true, default: "Ma Boutique" },
    shopLogo: { type: String },
    shopDescription: { type: String },
    contactEmail: {
      type: String,
      required: true,
      default: "contact@example.com",
    },
    contactPhone: { type: String },
    address: { type: String },
    currency: { type: String, default: "EUR" },
    shipping: {
      freeShippingThreshold: { type: Number },
      defaultWeight: { type: Number, default: 500 },
      homeDeliveryEnabled: { type: Boolean, default: true },
      mondialRelayEnabled: { type: Boolean, default: false },
      homeRate: { type: Number, default: 499 },
      pickupRate: { type: Number, default: 399 },
      homeFreeThreshold: { type: Number, default: 5000 },
      pickupFreeThreshold: { type: Number, default: 5000 },
    },
    tax: {
      rate: { type: Number, default: 20 },
      pricesIncludeTax: { type: Boolean, default: true },
      label: { type: String, default: "TVA" },
    },
    giftCards: {
      enabled: { type: Boolean, default: false },
      presets: {
        type: [
          {
            _id: false,
            amount: { type: Number, required: true }, // centimes
            label: { type: String },
          },
        ],
        default: [
          { amount: 2500, label: "Découverte" },
          { amount: 5000, label: "Plaisir" },
          { amount: 7500, label: "Gourmand" },
          { amount: 10000, label: "Prestige" },
        ],
      },
      expiryMonths: { type: Number, default: 12 },
      template: {
        logoUrl: { type: String },
        primaryColor: { type: String },
        backgroundColor: { type: String },
        backgroundImageUrl: { type: String },
        headline: { type: String },
        footerText: { type: String },
      },
    },
    invoice: {
      enabled: { type: Boolean, default: true },
      prefix: { type: String, default: "FAC-" },
      nextNumber: { type: Number, default: 1 },
      legalMention: { type: String, default: "TVA non applicable, art. 293 B du CGI" },
      iban: { type: String },
      bic: { type: String },
      bankName: { type: String },
    },
    analytics: {
      googleAnalyticsId: { type: String },
      plausibleDomain: { type: String },
      metaPixelId: { type: String },
      customHeadScript: { type: String },
    },
    integrations: {
      formspreeId: { type: String },
    },
    social: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      tiktok: { type: String },
      youtube: { type: String },
    },
    legal: {
      siret: { type: String },
      tva: { type: String },
      rcs: { type: String },
      capital: { type: String },
      legalForm: { type: String },
    },
    apiKeys: {
      stripeSecretKey: { type: String },
      stripePublishableKey: { type: String },
      stripeWebhookSecret: { type: String },
      sendcloudPublicKey: { type: String },
      sendcloudSecretKey: { type: String },
      resendApiKey: { type: String },
      resendFromEmail: { type: String },
      mondialRelayBrandCode: { type: String },
    },
  },
  { timestamps: true }
);

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
