import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/resend", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/notify", () => ({ getNotificationEmail: vi.fn(async () => "boutique@exemple.fr") }));
vi.mock("@/lib/reservation-emails", () => ({
  buildAtelierCustomerEmail: vi.fn(() => "<html>récapitulatif</html>"),
  getCoordonneesBoutique: vi.fn(async () => ({})),
}));

import { sendEmail } from "@/lib/resend";
import { buildAtelierCustomerEmail } from "@/lib/reservation-emails";
import { doitConfirmerVirement, envoyerVirementRecu, type ReservationVirement } from "@/lib/virement-recu";

const base: ReservationVirement = {
  type: "atelier",
  paymentMethod: "virement",
  status: "pending",
  reservationNumber: "RES-2610-0001",
  customerName: "Camille",
  customerEmail: "camille@exemple.fr",
  atelierTitle: "Atelier samoussas",
  sessionDate: "Samedi 7 novembre · 10h",
  participants: 2,
  amount: 9000,
};

describe("confirmation d'un virement reçu", () => {
  it("prévient le client quand un atelier par virement passe de « En attente » à « Confirmée »", () => {
    expect(doitConfirmerVirement(base, "confirmed")).toBe(true);
  });

  it("ne prévient pas pour un autre statut, une carte, un traiteur, un deuxième clic ou sans adresse", () => {
    expect(doitConfirmerVirement(base, "done")).toBe(false);
    expect(doitConfirmerVirement(base, "cancelled")).toBe(false);
    expect(doitConfirmerVirement({ ...base, paymentMethod: "carte" }, "confirmed")).toBe(false);
    expect(doitConfirmerVirement({ ...base, type: "traiteur" }, "confirmed")).toBe(false);
    expect(doitConfirmerVirement({ ...base, status: "confirmed" }, "confirmed")).toBe(false);
    expect(doitConfirmerVirement({ ...base, customerEmail: "" }, "confirmed")).toBe(false);
  });

  it("envoie au client le récapitulatif « paiement reçu », sans RIB", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ data: { id: "x" }, error: null } as never);
    expect(await envoyerVirementRecu(base)).toBe(true);
    const envoi = vi.mocked(sendEmail).mock.calls[0][0];
    expect(envoi.to).toBe("camille@exemple.fr");
    expect(envoi.subject).toBe("Virement bien reçu : votre place est confirmée (Atelier samoussas)");
    expect(envoi.kind).toBe("virement-recu");
    expect(envoi.replyTo).toBe("boutique@exemple.fr");
    const params = vi.mocked(buildAtelierCustomerEmail).mock.calls[0][0];
    expect(params.virement).toBeUndefined();
    expect(params.amount).toBe(9000);
  });

  it("signale un envoi refusé", async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce(null as never);
    expect(await envoyerVirementRecu(base)).toBe(false);
  });
});
