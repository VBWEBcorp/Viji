import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Une réservation payée (atelier ou traiteur Click & Collect).
 * Persistée après paiement Stripe confirmé, pour que la commerçante voie tout
 * dans l'admin (et non plus seulement par email).
 */
export interface IReservationItem {
  name: string;
  quantity: number;
  unitPrice: number; // centimes
}

export type ReservationStatus = "pending" | "confirmed" | "done" | "cancelled";

export interface IReservation extends Document {
  reservationNumber: string;
  type: "atelier" | "traiteur";

  // Client
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Atelier
  atelierSlug?: string;
  atelierTitle?: string;
  sessionDate?: string; // libellé (date + créneau)
  sessionLocation?: string;
  participants?: number;

  // Traiteur Click & Collect
  items?: IReservationItem[];
  pickupDate?: string;
  pickupTime?: string;

  notes?: string;

  amount: number; // centimes, payé
  paymentId: string; // PaymentIntent Stripe

  /** pending = à préparer, confirmed = confirmée, done = terminée, cancelled = annulée */
  status: ReservationStatus;

  createdAt: Date;
  updatedAt: Date;
}

const ReservationItemSchema = new Schema<IReservationItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ReservationSchema = new Schema<IReservation>(
  {
    reservationNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["atelier", "traiteur"], required: true, index: true },

    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, trim: true, lowercase: true },

    atelierSlug: { type: String, trim: true },
    atelierTitle: { type: String, trim: true },
    sessionDate: { type: String, trim: true },
    sessionLocation: { type: String, trim: true },
    participants: { type: Number, min: 1 },

    items: { type: [ReservationItemSchema], default: undefined },
    pickupDate: { type: String, trim: true },
    pickupTime: { type: String, trim: true },

    notes: { type: String },

    amount: { type: Number, required: true, min: 0 },
    paymentId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "done", "cancelled"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ createdAt: -1 });

const Reservation: Model<IReservation> =
  mongoose.models.Reservation ||
  mongoose.model<IReservation>("Reservation", ReservationSchema);

export default Reservation;
