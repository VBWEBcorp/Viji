import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Ouverture des canaux de vente.
 *
 * Ce qui se joue ici : quand Viji ferme une activité avant de s'absenter,
 * plus aucun paiement ne doit être encaissé pour cette activité. Une erreur
 * dans un sens fait payer un client pour un plat que personne ne cuisinera ;
 * dans l'autre, elle ferme la boutique sans que personne ne l'ait demandé.
 */

// Réglages renvoyés par la fausse base. Modifiés par chaque test.
let reglages: Record<string, unknown> | null = null;

vi.mock("@/lib/db", () => ({ connectDB: vi.fn(async () => {}) }));

vi.mock("@/models/SiteSettings", () => ({
  default: {
    findOne: () => ({
      select: () => ({
        lean: async () => reglages,
      }),
    }),
  },
}));

const {
  getEtatCanal,
  canalOuvert,
  messageCanalFerme,
  libelleDateRetour,
  invalidateDisponibiliteCache,
} = await import("@/lib/disponibilite");

beforeEach(() => {
  reglages = null;
  invalidateDisponibiliteCache();
});

describe("canaux ouverts par défaut", () => {
  it("laisse tout ouvert quand aucun réglage n'existe encore", async () => {
    expect(await canalOuvert("traiteurEmporter")).toBe(true);
    expect(await canalOuvert("ateliers")).toBe(true);
    expect(await canalOuvert("boutique")).toBe(true);
  });

  it("laisse tout ouvert quand la section availability est absente", async () => {
    reglages = { contactEmail: "viji@example.com" };
    expect(await canalOuvert("boutique")).toBe(true);
  });
});

describe("fermeture d'un seul canal", () => {
  it("ferme le traiteur sans toucher aux ateliers ni à la boutique", async () => {
    reglages = { availability: { traiteurEmporter: false } };
    expect(await canalOuvert("traiteurEmporter")).toBe(false);
    expect(await canalOuvert("ateliers")).toBe(true);
    expect(await canalOuvert("boutique")).toBe(true);
  });
});

describe("mode vacances", () => {
  it("ferme les trois canaux d'un coup", async () => {
    reglages = { availability: { vacationMode: true } };
    expect(await canalOuvert("traiteurEmporter")).toBe(false);
    expect(await canalOuvert("ateliers")).toBe(false);
    expect(await canalOuvert("boutique")).toBe(false);
  });

  it("prime sur des interrupteurs individuels restés ouverts", async () => {
    // Le retour de vacances doit pouvoir se faire en décochant une seule case :
    // les réglages individuels sont conservés, pas écrasés.
    reglages = {
      availability: {
        vacationMode: true,
        traiteurEmporter: true,
        ateliers: true,
        boutique: true,
      },
    };
    expect(await canalOuvert("ateliers")).toBe(false);

    invalidateDisponibiliteCache();
    reglages = {
      availability: {
        vacationMode: false,
        traiteurEmporter: true,
        ateliers: true,
        boutique: true,
      },
    };
    expect(await canalOuvert("ateliers")).toBe(true);
  });
});

describe("message affiché au visiteur", () => {
  it("reprend le message personnalisé saisi dans l'admin", async () => {
    reglages = {
      availability: { vacationMode: true, message: "Je reviens le 9 septembre." },
    };
    const etat = await getEtatCanal("traiteurEmporter");
    expect(etat.message).toBe("Je reviens le 9 septembre.");
  });

  it("fournit un message générique quand aucun n'est saisi", async () => {
    reglages = { availability: { traiteurEmporter: false } };
    const etat = await getEtatCanal("traiteurEmporter");
    expect(etat.message).toContain("emporter");
    expect(etat.titre).toBeTruthy();
  });

  it("ajoute la date de reprise au message d'erreur de l'API", async () => {
    reglages = {
      availability: { vacationMode: true, message: "Fermé.", returnDate: "2026-09-09" },
    };
    const etat = await getEtatCanal("boutique");
    expect(etat.retour).toBe("mercredi 9 septembre");
    expect(messageCanalFerme(etat)).toBe("Fermé. Reprise des commandes le mercredi 9 septembre.");
  });

  it("n'invente pas de date de reprise quand le champ est vide", async () => {
    reglages = { availability: { vacationMode: true, message: "Fermé." } };
    const etat = await getEtatCanal("boutique");
    expect(etat.retour).toBe("");
    expect(messageCanalFerme(etat)).toBe("Fermé.");
  });
});

describe("libelleDateRetour", () => {
  it("écrit la date en clair", () => {
    expect(libelleDateRetour("2026-09-09")).toBe("mercredi 9 septembre");
  });

  it("renvoie la valeur brute si elle n'est pas une date", () => {
    expect(libelleDateRetour("bientot")).toBe("bientot");
  });
});

describe("incident de base de données", () => {
  it("garde le site ouvert plutôt que de bloquer les ventes", async () => {
    // Une base injoignable ne doit pas fermer la boutique : le risque d'un
    // faux positif ici, c'est de perdre des ventes sans que personne ne le sache.
    const erreur = vi.spyOn(console, "error").mockImplementation(() => {});
    reglages = null;
    const SiteSettings = (await import("@/models/SiteSettings")).default;
    vi.spyOn(SiteSettings, "findOne").mockImplementationOnce(() => {
      throw new Error("Mongo injoignable");
    });

    expect(await canalOuvert("boutique")).toBe(true);
    expect(erreur).toHaveBeenCalled();
    erreur.mockRestore();
  });
});
