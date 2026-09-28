import { describe, it, expect } from "vitest";
import { calculeRemise, remiseDuPaiement, libelleRemise } from "@/lib/promo";
import { buildTraiteurCustomerEmail, buildAtelierCustomerEmail } from "@/lib/reservation-emails";

const coord = { adresse: "3 rue de la Libération, 35770 Vern-sur-Seiche", telephone: "" };

describe("calculeRemise", () => {
  it("applique un pourcentage arrondi au centime", () => {
    expect(calculeRemise({ type: "percentage", value: 10 }, 4590)).toBe(459);
    expect(calculeRemise({ type: "percentage", value: 15 }, 1999)).toBe(300);
  });

  it("applique un montant fixe sans dépasser le sous-total", () => {
    expect(calculeRemise({ type: "fixed", value: 500 }, 4590)).toBe(500);
    expect(calculeRemise({ type: "fixed", value: 5000 }, 1200)).toBe(1200);
  });

  it("ne retire rien pour la livraison offerte hors boutique", () => {
    expect(calculeRemise({ type: "free_shipping", value: 0 }, 4590)).toBe(0);
  });
});

describe("remiseDuPaiement", () => {
  it("relit le code et la remise gravés dans le paiement", () => {
    expect(remiseDuPaiement({ kind: "traiteur", promoCode: "NOEL", promoDiscount: "459" })).toEqual({
      promoCode: "NOEL",
      discount: 459,
    });
  });

  it("sans code, aucune remise", () => {
    expect(remiseDuPaiement({ kind: "traiteur" })).toEqual({ promoCode: "", discount: 0 });
    expect(remiseDuPaiement(undefined)).toEqual({ promoCode: "", discount: 0 });
  });

  it("ignore une remise illisible ou négative", () => {
    expect(remiseDuPaiement({ promoCode: "X", promoDiscount: "abc" }).discount).toBe(0);
    expect(remiseDuPaiement({ promoCode: "X", promoDiscount: "-50" }).discount).toBe(0);
  });
});

describe("libelleRemise", () => {
  it("écrit la remise sans tiret long", () => {
    expect(libelleRemise({ type: "percentage", value: 10 })).toBe("-10 %");
    expect(libelleRemise({ type: "fixed", value: 500 })).toBe("-5,00 €");
  });
});

describe("emails de confirmation avec code promo", () => {
  it("le client voit le code et la remise (traiteur)", () => {
    const html = buildTraiteurCustomerEmail({
      reservationNumber: "R-1",
      name: "Jean",
      pickupDate: "2026-12-20",
      pickupTime: "12:30",
      lines: [{ name: "Butter chicken", quantity: 2, unitPrice: 1450 }],
      total: 2610,
      promo: { code: "NOEL", discount: 290 },
      coordonnees: coord,
    });
    expect(html).toContain("Code promo NOEL");
    expect(html).toContain("-2,90 €");
    expect(html).toContain("26,10 €");
  });

  it("le participant voit le code et la remise (atelier)", () => {
    const html = buildAtelierCustomerEmail({
      reservationNumber: "R-2",
      name: "Jean",
      sessionTitle: "Atelier samoussas",
      sessionDate: "12 décembre",
      participants: 2,
      amount: 10800,
      promo: { code: "NOEL", discount: 1200 },
      coordonnees: coord,
    });
    expect(html).toContain("Code promo NOEL");
    expect(html).toContain("-12,00 €");
  });

  it("sans code, aucune ligne de remise", () => {
    const html = buildAtelierCustomerEmail({
      reservationNumber: "R-3",
      name: "Jean",
      sessionTitle: "Atelier",
      sessionDate: "12 décembre",
      participants: 1,
      amount: 6000,
      coordonnees: coord,
    });
    expect(html).not.toContain("Code promo");
  });
});
