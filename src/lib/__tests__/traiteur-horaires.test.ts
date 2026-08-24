import { describe, it, expect } from "vitest";
import {
  ajouteJours,
  commandesDuJourCloses,
  libelleJour,
  maintenantAParis,
  premiereDateRetrait,
  verifieDateRetrait,
} from "@/lib/traiteur-horaires";

/** Un instant precis, exprime en UTC, pour ne dependre d'aucun fuseau machine. */
const utc = (iso: string) => new Date(iso);

describe("lecture de l'heure de Paris", () => {
  it("lit l'heure francaise, pas celle de la machine", () => {
    // 14h30 UTC en ete = 16h30 a Paris.
    expect(maintenantAParis(utc("2026-08-24T14:30:00Z"))).toEqual({
      date: "2026-08-24",
      heure: 16,
      minute: 30,
    });
  });

  it("en hiver le decalage n'est plus le meme", () => {
    // 16h30 UTC en hiver = 17h30 a Paris : ferme.
    expect(maintenantAParis(utc("2026-01-15T16:30:00Z")).heure).toBe(17);
    expect(commandesDuJourCloses(utc("2026-01-15T16:30:00Z"))).toBe(true);
    // La meme heure UTC en ete = 18h30 a Paris : ferme aussi.
    expect(maintenantAParis(utc("2026-08-15T16:30:00Z")).heure).toBe(18);
  });

  it("le soir, le jour parisien n'est pas le jour UTC", () => {
    // 22h30 UTC le 24 = 00h30 a Paris le 25.
    const nuit = utc("2026-08-24T22:30:00Z");
    expect(maintenantAParis(nuit).date).toBe("2026-08-25");
    // C'est le piege de l'ancien code : toISOString() aurait donne le 24.
    expect(nuit.toISOString().slice(0, 10)).toBe("2026-08-24");
  });
});

describe("fermeture a 17h", () => {
  it("ouvert a 16h59, ferme a 17h00 pile", () => {
    expect(commandesDuJourCloses(utc("2026-08-24T14:59:00Z"))).toBe(false); // 16h59
    expect(commandesDuJourCloses(utc("2026-08-24T15:00:00Z"))).toBe(true); // 17h00
  });

  it("avant 17h on retire le jour meme, apres on bascule au lendemain", () => {
    expect(premiereDateRetrait(utc("2026-08-24T09:00:00Z"))).toBe("2026-08-24"); // 11h
    expect(premiereDateRetrait(utc("2026-08-24T15:30:00Z"))).toBe("2026-08-25"); // 17h30
  });

  it("juste apres minuit, la journee est de nouveau ouverte", () => {
    // 00h30 a Paris le 25 : on peut commander pour le 25.
    expect(premiereDateRetrait(utc("2026-08-24T22:30:00Z"))).toBe("2026-08-25");
    expect(commandesDuJourCloses(utc("2026-08-24T22:30:00Z"))).toBe(false);
  });

  it("passe un mois, le lendemain reste juste", () => {
    expect(premiereDateRetrait(utc("2026-08-31T15:30:00Z"))).toBe("2026-09-01");
    expect(ajouteJours("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("garde-fou serveur", () => {
  const apres17h = utc("2026-08-24T15:30:00Z"); // 17h30 a Paris
  const avant17h = utc("2026-08-24T09:00:00Z"); // 11h a Paris

  it("refuse le jour meme apres 17h, en expliquant pourquoi", () => {
    const message = verifieDateRetrait("2026-08-24", apres17h);
    expect(message).toContain("closes");
    expect(message).toContain("17h");
  });

  it("accepte le lendemain et les jours suivants apres 17h", () => {
    expect(verifieDateRetrait("2026-08-25", apres17h)).toBeNull();
    expect(verifieDateRetrait("2026-09-02", apres17h)).toBeNull();
  });

  it("accepte le jour meme avant 17h", () => {
    expect(verifieDateRetrait("2026-08-24", avant17h)).toBeNull();
  });

  it("refuse une date passee, quelle que soit l'heure", () => {
    expect(verifieDateRetrait("2026-08-20", avant17h)).toContain("passée");
    expect(verifieDateRetrait("2020-01-01", apres17h)).toBeTruthy();
  });

  it("refuse ce qui n'est pas une date", () => {
    expect(verifieDateRetrait("", avant17h)).toContain("invalide");
    expect(verifieDateRetrait("demain", avant17h)).toContain("invalide");
    expect(verifieDateRetrait("24/08/2026", avant17h)).toContain("invalide");
  });
});

describe("libelle des jours proposes", () => {
  const apres17h = utc("2026-08-24T15:30:00Z"); // lundi 24 aout, 17h30

  it("nomme demain et apres-demain en clair", () => {
    expect(libelleJour("2026-08-25", apres17h)).toBe("demain (mardi 25 août)");
    expect(libelleJour("2026-08-26", apres17h)).toBe("après-demain (mercredi 26 août)");
  });

  it("au-dela, donne simplement la date", () => {
    expect(libelleJour("2026-08-29", apres17h)).toBe("samedi 29 août");
  });
});
