import { describe, it, expect, afterAll, beforeEach, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { NextRequest } from "next/server";

/**
 * Parcours reel du mode vacances, de bout en bout, sur une base jetable.
 *
 * Les tests unitaires verifient la logique d'ouverture. Ceux-ci verifient ce
 * qui se passe vraiment quand la commercante coche la case et enregistre :
 * la valeur traverse la route de sauvegarde, se retrouve en base, et ferme
 * effectivement les canaux. C'est la partie ou une erreur ne se verrait pas
 * en relisant le code : un champ absent du modele, une sauvegarde imbriquee
 * qui ne prend pas, un cache qui ne s'invalide pas.
 */

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { role: "admin", email: "admin@test.fr" } })),
}));

vi.mock("@/lib/db", () => ({
  connectDB: async () => {
    const mongoose = (await import("mongoose")).default;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    return mongoose.connection;
  },
}));

const memoire = await MongoMemoryServer.create();
process.env.MONGODB_URI = memoire.getUri();

// La connexion est etablie ici, avant tout test : les modeles Mongoose
// mettraient sinon leurs requetes en file d'attente jusqu'a expiration.
const mongoose = (await import("mongoose")).default;
await mongoose.connect(memoire.getUri());

const { POST: sauvegardeReglages, GET: litReglages } = await import(
  "@/app/api/settings/route"
);
const { getEtatCanal, invalidateDisponibiliteCache } = await import(
  "@/lib/disponibilite"
);
const SiteSettings = (await import("@/models/SiteSettings")).default;

afterAll(async () => {
  await mongoose.disconnect();
  await memoire.stop();
});

/** Requete minimale : la route ne lit que le corps JSON. */
function requete(corps: unknown): NextRequest {
  return { json: async () => corps } as unknown as NextRequest;
}

/** Ce que le formulaire de l'admin envoie quand on clique sur Sauvegarder. */
function reglages(availability: Record<string, unknown>) {
  return {
    shopName: "Entre Maman et Moi",
    contactEmail: "entremamanetmoicook@gmail.com",
    availability,
  };
}

beforeEach(async () => {
  await SiteSettings.deleteMany({});
  invalidateDisponibiliteCache();
});

describe("réglages de disponibilité", () => {
  it("crée des réglages ouverts par défaut", async () => {
    const res = await litReglages();
    const data = await res.json();

    expect(data.availability.vacationMode).toBe(false);
    expect(data.availability.traiteurEmporter).toBe(true);
    expect(data.availability.ateliers).toBe(true);
    expect(data.availability.boutique).toBe(true);
  });

  it("enregistre le mode vacances et ferme les trois canaux", async () => {
    const res = await sauvegardeReglages(
      requete(
        reglages({
          vacationMode: true,
          message: "Je suis en congés jusqu'au 9 septembre.",
          returnDate: "2026-09-09",
          traiteurEmporter: true,
          ateliers: true,
          boutique: true,
        })
      )
    );
    expect(res.status).toBe(200);

    // La valeur est bien arrivée en base, pas seulement dans la réponse.
    const enBase = await SiteSettings.findOne().lean();
    expect(enBase?.availability?.vacationMode).toBe(true);

    const traiteur = await getEtatCanal("traiteurEmporter");
    const ateliers = await getEtatCanal("ateliers");
    const boutique = await getEtatCanal("boutique");

    expect(traiteur.ouvert).toBe(false);
    expect(ateliers.ouvert).toBe(false);
    expect(boutique.ouvert).toBe(false);

    // Le message et la date saisis sont ceux que verra le visiteur.
    expect(traiteur.message).toBe("Je suis en congés jusqu'au 9 septembre.");
    expect(traiteur.retour).toBe("mercredi 9 septembre");
  });

  it("ferme le traiteur seul, sans toucher aux ateliers", async () => {
    await sauvegardeReglages(
      requete(
        reglages({
          vacationMode: false,
          message: "",
          returnDate: "",
          traiteurEmporter: false,
          ateliers: true,
          boutique: true,
        })
      )
    );

    expect((await getEtatCanal("traiteurEmporter")).ouvert).toBe(false);
    expect((await getEtatCanal("ateliers")).ouvert).toBe(true);
    expect((await getEtatCanal("boutique")).ouvert).toBe(true);
  });

  it("rouvre tout quand on décoche le mode vacances", async () => {
    await sauvegardeReglages(
      requete(
        reglages({
          vacationMode: true,
          message: "Fermé.",
          returnDate: "",
          traiteurEmporter: true,
          ateliers: true,
          boutique: true,
        })
      )
    );
    expect((await getEtatCanal("ateliers")).ouvert).toBe(false);

    await sauvegardeReglages(
      requete(
        reglages({
          vacationMode: false,
          message: "Fermé.",
          returnDate: "",
          traiteurEmporter: true,
          ateliers: true,
          boutique: true,
        })
      )
    );

    // Sans invalidation du cache par la route, cette ligne echouerait :
    // la reouverture ne serait visible qu'au bout de trente secondes.
    expect((await getEtatCanal("ateliers")).ouvert).toBe(true);
    expect((await getEtatCanal("traiteurEmporter")).ouvert).toBe(true);
    expect((await getEtatCanal("boutique")).ouvert).toBe(true);
  });

  it("conserve les interrupteurs individuels pendant les vacances", async () => {
    // Le retour de vacances doit se faire en decochant une seule case : si le
    // mode vacances ecrasait les reglages, le traiteur ferme a la main
    // reouvrirait tout seul au retour.
    await sauvegardeReglages(
      requete(
        reglages({
          vacationMode: true,
          message: "",
          returnDate: "",
          traiteurEmporter: false,
          ateliers: true,
          boutique: true,
        })
      )
    );

    const enBase = await SiteSettings.findOne().lean();
    expect(enBase?.availability?.traiteurEmporter).toBe(false);
    expect(enBase?.availability?.ateliers).toBe(true);
  });

  it("refuse la sauvegarde à quelqu'un qui n'est pas administrateur", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValueOnce(null as never);

    const res = await sauvegardeReglages(
      requete(reglages({ vacationMode: true }))
    );
    expect(res.status).toBe(401);
  });
});
