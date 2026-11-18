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
