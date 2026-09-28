import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

/**
 * Panneau affiché à la place d'un formulaire de commande quand l'activité est
 * suspendue. Ce qui compte pour le visiteur : comprendre qu'il ne peut pas
 * commander maintenant, et savoir quand revenir.
 */

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

const CanalFerme = (await import("@/components/shop/CanalFerme")).default;

const etatFerme = {
  ouvert: false,
  titre: "Commandes à emporter suspendues",
  message: "Je suis en congés jusqu'au 9 septembre.",
  retour: "mercredi 9 septembre",
};

describe("CanalFerme", () => {
  it("affiche le titre et le message destinés au visiteur", () => {
    const html = renderToStaticMarkup(<CanalFerme etat={etatFerme} />);
    expect(html).toContain("Commandes à emporter suspendues");
    expect(html).toContain("Je suis en congés jusqu&#x27;au 9 septembre.");
  });

  it("annonce la date de reprise quand elle est renseignée", () => {
    const html = renderToStaticMarkup(<CanalFerme etat={etatFerme} />);
    expect(html).toContain("mercredi 9 septembre");
    expect(html).toContain("Reprise des commandes le");
  });

  it("n'affiche aucune date de reprise quand il n'y en a pas", () => {
    const html = renderToStaticMarkup(
      <CanalFerme etat={{ ...etatFerme, retour: "" }} />
    );
    expect(html).not.toContain("Reprise des commandes le");
  });

  it("laisse une porte de sortie vers le formulaire de contact", () => {
    const html = renderToStaticMarkup(<CanalFerme etat={etatFerme} />);
    expect(html).toContain('href="/contact"');
  });

  it("peut masquer le renvoi vers le contact", () => {
    const html = renderToStaticMarkup(
      <CanalFerme etat={etatFerme} contact={false} />
    );
    expect(html).not.toContain('href="/contact"');
  });
});
