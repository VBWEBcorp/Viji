import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProgramBlock {
  title: string;
  body: string;
}

/**
 * Une occurrence = un créneau précis (date + lieu) où l'atelier est proposé.
 * Une même session peut avoir plusieurs occurrences (ex. atelier samoussa
 * proposé à Association Rennes ET à Association Triangle, à différentes dates).
 */
export interface IOccurrence {
  date: string;        // libellé affiché : "Samedi 14 juin 2026"
  dateISO?: string;    // YYYY-MM-DD pour tri chronologique
  schedule: string;    // "10h – 12h30"
  location: string;    // "Association Rennes" / "Association Triangle"
}

export interface IAtelierSession extends Document {
  slug: string;
  shortTitle: string;
  title: string;
  image: string;
  /** Une ou plusieurs occurrences. Le client choisit dans un dropdown. */
  occurrences: IOccurrence[];
  /** Champs legacy (ancien modèle, gardés pour fallback / tri). */
  location?: string;
  date?: string;
  dateISO?: string;
  schedule?: string;
  price: number;
  intro: string;
  menu: string;
  program: IProgramBlock[];
  notes: IProgramBlock[];
  /** Permet de masquer une session sans la supprimer. */
  isActive: boolean;
  /** Ordre d'affichage manuel (croissant). */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramBlockSchema = new Schema<IProgramBlock>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
  },
  { _id: false }
);

const OccurrenceSchema = new Schema<IOccurrence>(
  {
    date: { type: String, required: true, trim: true },
    dateISO: { type: String },
    schedule: { type: String, required: true, trim: true, default: "10h – 12h30" },
    location: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AtelierSessionSchema = new Schema<IAtelierSession>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortTitle: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    occurrences: { type: [OccurrenceSchema], default: [] },
    // Champs legacy : conservés pour rétrocompat / tri.
    location: { type: String, trim: true },
    date: { type: String, trim: true },
    dateISO: { type: String, index: true },
    schedule: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    intro: { type: String, required: true },
    menu: { type: String, required: true },
    program: { type: [ProgramBlockSchema], default: [] },
    notes: { type: [ProgramBlockSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AtelierSessionSchema.index({ isActive: 1, dateISO: 1 });
AtelierSessionSchema.index({ isActive: 1, order: 1 });

const AtelierSession: Model<IAtelierSession> =
  mongoose.models.AtelierSession ||
  mongoose.model<IAtelierSession>("AtelierSession", AtelierSessionSchema);

export default AtelierSession;
