import { describe, it, expect } from "vitest";
import { generateOrderConfirmationEmail } from "@/components/emails/OrderConfirmation";

const TALLAT = "TALLAT épicerie asiatique, 55 Rue du Manoir de Servigné, 35132 Rennes";
const base = {
  orderNumber: "CMD-TEST",
  customerName: "Test",
  items: [
    { name: "Asian food box", quantity: 1, unitPrice: 6500, variant: "Click & Collect", lieuRetrait: TALLAT },
    { name: "Kit Samoussa", quantity: 1, unitPrice: 2500, variant: "Click & Collect", lieuRetrait: "Vern-sur-Seiche" },
  ],
  subtotal: 9000,
  shippingCost: 0,
  discount: 0,
  total: 9000,
  shippingMethod: "click-collect",
  shippingAddress: { name: "Test", street: "1 rue", city: "Rennes", zip: "35000", country: "FR" },
};

describe("e-mail de confirmation de commande", () => {
  it("donne les deux adresses de retrait d'un panier mélangé", () => {
    const html = generateOrderConfirmationEmail(base);
    expect(html).toContain("TALLAT épicerie asiatique");
    expect(html).toContain("Kit Samoussa : retrait à Vern-sur-Seiche");
  });
  it("reprend les informations du cadeau, échappées", () => {
    const html = generateOrderConfirmationEmail({
      ...base,
      cadeau: { email: "camille@example.com", prenom: "Camille", message: "Joyeuses fêtes <3" },
    });
    expect(html).toContain("C'est un cadeau");
    expect(html).toContain("Camille");
    expect(html).toContain("camille@example.com");
    expect(html).toContain("Joyeuses fêtes &lt;3");
  });
  it("sans cadeau, pas de bloc cadeau", () => {
    expect(generateOrderConfirmationEmail(base)).not.toContain("C'est un cadeau");
  });
});
