import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Journal de TOUS les emails que le site tente d'envoyer, succès comme échecs.
 *
 * Raison d'être : le SDK Resend ne lève pas d'exception, il renvoie
 * `{ data, error }`. Un envoi refusé (domaine non vérifié, destinataire non
 * autorisé, quota) passait donc dans un `console.error` invisible depuis
 * l'admin, et un parcours de paiement se terminait normalement alors que le
 * client ne recevait rien. Personne ne pouvait s'en apercevoir.
 *
 * Ici, chaque tentative laisse une trace consultable : qui, quand, quel sujet,
 * envoyé ou refusé, et le message d'erreur exact de Resend. Le corps HTML est
 * conservé pour pouvoir relire ce qui est réellement parti.
 */
export interface IEmailLog extends Document {
  to: string;
  from: string;
  subject: string;
  /** « envoye » ou « echec ». */
  status: "envoye" | "echec";
  /** Message d'erreur brut renvoyé par Resend, si refus. */
  error?: string;
  /** Identifiant Resend du message, pour retrouver l'envoi dans leur console. */
  resendId?: string;
  /**
   * Nature de l'envoi : « confirmation-atelier », « notification-traiteur »,
   * « confirmation-commande », « test-admin », « newsletter »… Permet de
   * retrouver rapidement tous les emails d'un même type.
   */
  kind?: string;
  /** Référence métier associée (numéro de réservation ou de commande). */
  reference?: string;
  /** Corps HTML envoyé. Absent pour les envois en masse (newsletter). */
  html?: string;
  /**
   * Devenir du message APRÈS acceptation par Resend, renseigné par le webhook
   * `/api/webhooks/resend`. Un « 200 » à l'envoi signifie seulement que Resend
   * a pris le message en charge : il ne dit rien de son arrivée dans la boîte
   * du destinataire. C'est ce champ qui répond à « l'a-t-elle reçu ? ».
   */
  delivery?: "accepte" | "remis" | "differe" | "rejete" | "plainte";
  /** Détail fourni par Resend en cas de rejet (motif du bounce). */
  deliveryDetail?: string;
  /** Date du dernier événement de remise reçu. */
  deliveryAt?: Date;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    to: { type: String, required: true, index: true },
    from: { type: String, default: "" },
    subject: { type: String, default: "" },
    status: { type: String, enum: ["envoye", "echec"], required: true, index: true },
    error: { type: String },
    resendId: { type: String },
    kind: { type: String, index: true },
    reference: { type: String, index: true },
    html: { type: String },
    delivery: {
      type: String,
      enum: ["accepte", "remis", "differe", "rejete", "plainte"],
      index: true,
    },
    deliveryDetail: { type: String },
    deliveryAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Le journal se consulte du plus récent au plus ancien.
EmailLogSchema.index({ createdAt: -1 });

const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);

export default EmailLog;
