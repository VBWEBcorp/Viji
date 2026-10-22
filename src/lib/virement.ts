import { connectDB } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

export interface Rib {
  titulaire: string;
  iban: string;
  bic: string;
}

/**
 * Coordonnées bancaires à donner au client qui réserve un atelier, si
 * l'atelier se règle par virement (Réglages → Virement) ET que l'IBAN est
 * saisi. Sinon null : le paiement par carte reste en place.
 */
export async function ribPourAteliers(): Promise<Rib | null> {
  await connectDB();
  const s = await SiteSettings.findOne({}, { virement: 1, invoice: 1 }).lean();
  if (!s?.virement?.ateliers || !s.invoice?.iban) return null;
  return {
    titulaire: s.invoice.accountHolder || "",
    iban: s.invoice.iban,
    bic: s.invoice.bic || "",
  };
}
