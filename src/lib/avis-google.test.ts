import { describe, expect, it } from "vitest";
import { libelleAvis } from "./avis-google";

describe("libelleAvis", () => {
  it("complète un nombre seul", () => {
    expect(libelleAvis("21")).toBe("21 avis");
    expect(libelleAvis(" 21 ")).toBe("21 avis");
  });
  it("garde un libellé déjà complet", () => {
    expect(libelleAvis("19 avis")).toBe("19 avis");
  });
});

import { avisPourAccueil, ilYA, raccourcir } from "./avis-google";

describe("avis Google synchronisés", () => {
  const now = new Date("2026-11-19T10:00:00Z");
  it("date relative comme sur Google", () => {
    expect(ilYA(new Date("2026-11-14T10:00:00Z"), now)).toBe("il y a 5 jours");
    expect(ilYA(new Date("2026-11-05T10:00:00Z"), now)).toBe("il y a 2 semaines");
    expect(ilYA(new Date("2026-10-15T10:00:00Z"), now)).toBe("il y a un mois");
    expect(ilYA(new Date("2026-07-01T10:00:00Z"), now)).toBe("il y a 4 mois");
  });
  it("raccourcit à la dernière phrase complète", () => {
    const t = "Phrase une. ".repeat(40);
    const r = raccourcir(t, 100);
    expect(r.length).toBeLessThanOrEqual(100);
    expect(r.endsWith(".")).toBe(true);
  });
  it("garde les bons avis avec texte, les plus récents d'abord", () => {
    const l = avisPourAccueil(
      [
        { auteur: "Ancien", note: 5, texte: "Bien", creeLe: "2026-01-01" },
        { auteur: "Récent", note: 5, texte: "Super", creeLe: "2026-11-10" },
        { auteur: "Sans texte", note: 5, texte: "", creeLe: "2026-11-11" },
        { auteur: "Déçu", note: 2, texte: "Bof", creeLe: "2026-11-12" },
      ],
      25,
      now,
    );
    expect(l.map((a) => a.name)).toEqual(["Récent", "Ancien"]);
    expect(l[0].initial).toBe("R");
  });
  it("liste vide sans avis synchronisés", () => {
    expect(avisPourAccueil([])).toEqual([]);
  });
});
