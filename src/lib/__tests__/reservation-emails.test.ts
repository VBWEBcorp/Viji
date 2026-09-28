import { describe, it, expect, vi } from "vitest";

/**
 * Emails de confirmation envoyés au client après une réservation payée.
 *
 * Contexte : ces deux parcours n'envoyaient que la notification interne. Le
 * client payait, lisait « un récapitulatif vous a été envoyé » et ne recevait
 * rien. Ces tests verrouillent le contenu minimum de ce qu'il doit recevoir :
 * de quoi se présenter le jour J sans rappeler la boutique.
 */

vi.mock("@/lib/db", () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock("@/models/SiteSettings", () => ({
  default: { findOne: () => ({ select: () => ({ lean: async () => null }) }) },
}));

const { buildAtelierCustomerEmail, buildTraiteurCustomerEmail } = await import(
  "@/lib/reservation-emails"
);

const coordonnees = {
  adresse: "3 rue de la Libération, 35770 Vern-sur-Seiche",
  telephone: "06 12 34 56 78",
};

describe("confirmation d'atelier", () => {
  const html = buildAtelierCustomerEmail({
    reservationNumber: "RES-2608-4242",
    name: "Claire Dupont",
    sessionTitle: "Atelier cuisine indienne",
    sessionDate: "samedi 12 septembre, 14h",
    sessionLocation: "Vern-sur-Seiche",
    participants: 2,
    amount: 13000,
    notes: "Allergie aux fruits à coque",
    coordonnees,
  });

  it("nomme le participant et l'atelier réservé", () => {
    expect(html).toContain("Claire Dupont");
    expect(html).toContain("Atelier cuisine indienne");
  });

  it("donne la date, le lieu et le nombre de participants", () => {
    expect(html).toContain("samedi 12 septembre, 14h");
    expect(html).toContain("Vern-sur-Seiche");
    expect(html).toContain("Participants");
  });

  it("indique le montant réglé et le numéro de réservation", () => {
    expect(html).toContain("130,00 €");
    expect(html).toContain("RES-2608-4242");
  });

  it("rappelle ce que le client a signalé", () => {
    expect(html).toContain("Allergie aux fruits à coque");
  });

  it("échappe le HTML des champs saisis par le client", () => {
    const injecte = buildAtelierCustomerEmail({
      reservationNumber: "RES-2608-0001",
      name: "<script>alert(1)</script>",
      sessionTitle: "Atelier",
      sessionDate: "demain",
      participants: 1,
      amount: 5000,
      coordonnees,
    });
    expect(injecte).not.toContain("<script>alert(1)</script>");
    expect(injecte).toContain("&lt;script&gt;");
  });
});

describe("confirmation Click & Collect", () => {
  const html = buildTraiteurCustomerEmail({
    reservationNumber: "RES-2608-7777",
    name: "Paul Martin",
    pickupDate: "2026-09-12",
    pickupTime: "12h30",
    lines: [
      { name: "Poulet tikka", quantity: 2, unitPrice: 1250 },
      { name: "Riz au citron", quantity: 1, unitPrice: 600 },
    ],
    total: 3100,
    comment: "Sans piment",
    coordonnees,
  });

  it("donne la date, le créneau et l'adresse de retrait", () => {
    expect(html).toContain("2026-09-12");
    expect(html).toContain("12h30");
    expect(html).toContain("3 rue de la Libération, 35770 Vern-sur-Seiche");
  });

  it("détaille les plats commandés avec leur total ligne", () => {
    expect(html).toContain("Poulet tikka");
    expect(html).toContain("25,00 €"); // 2 × 12,50
    expect(html).toContain("Riz au citron");
    expect(html).toContain("6,00 €");
  });

  it("indique le montant réglé et le numéro de commande", () => {
    expect(html).toContain("31,00 €");
    expect(html).toContain("RES-2608-7777");
  });

  it("reprend le commentaire du client", () => {
    expect(html).toContain("Sans piment");
  });
});
