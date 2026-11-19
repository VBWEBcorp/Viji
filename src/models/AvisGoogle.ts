import mongoose, { Schema, Model } from "mongoose";

/**
 * Avis Google de la fiche « Entre Maman et Moi », copiés chaque jour par la
 * synchronisation du VPS (phare/_gmb-viji/synchro-avis.ts). Lecture seule ici :
 * le site ne les modifie jamais. _id = identifiant Google de l'avis.
 */
export interface IAvisGoogle {
  _id: string;
  auteur: string;
  photo?: string;
  note: number;
  texte: string;
  creeLe?: Date | null;
  majLe?: Date | null;
  synchroLe?: Date;
}

const AvisGoogleSchema = new Schema<IAvisGoogle>(
  {
    _id: { type: String },
    auteur: String,
    photo: String,
    note: Number,
    texte: String,
    creeLe: Date,
    majLe: Date,
    synchroLe: Date,
  },
  { collection: "avis_google", versionKey: false }
);

const AvisGoogle: Model<IAvisGoogle> =
  mongoose.models.AvisGoogle || mongoose.model<IAvisGoogle>("AvisGoogle", AvisGoogleSchema);

export default AvisGoogle;
