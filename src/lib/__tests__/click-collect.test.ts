import { describe, it, expect } from "vitest";
import {
  VARIANTE_CLICK_COLLECT,
  prixUnitaire,
  remiseClickCollect,
  toutEnClickCollect,
} from "../click-collect";

describe("remise Click & Collect", () => {
  it("vaut 5 € quand rien n'est réglé", () => {
    expect(remiseClickCollect(undefined)).toBe(500);
    expect(remiseClickCollect({})).toBe(500);
  });

  it("suit le réglage de l'admin, zéro compris", () => {
    expect(remiseClickCollect({ clickCollectDiscount: 350 })).toBe(350);
    expect(remiseClickCollect({ clickCollectDiscount: 0 })).toBe(0);
  });

  it("ignore une valeur négative", () => {
    expect(remiseClickCollect({ clickCollectDiscount: -100 })).toBe(500);
  });
});

describe("prix unitaire d'un kit", () => {
  it("garde le prix (livraison comprise) en point relais", () => {
    expect(prixUnitaire(2000, "Mondial Relay", 500)).toBe(2000);
  });

  it("retire la livraison en Click & Collect", () => {
    expect(prixUnitaire(2000, VARIANTE_CLICK_COLLECT, 500)).toBe(1500);
  });

  it("ne descend jamais sous zéro", () => {
    expect(prixUnitaire(300, VARIANTE_CLICK_COLLECT, 500)).toBe(0);
  });
});

describe("commande retirée sur place", () => {
  it("seulement si tout le panier est en Click & Collect", () => {
    expect(toutEnClickCollect([{ variant: VARIANTE_CLICK_COLLECT }, { variant: VARIANTE_CLICK_COLLECT }])).toBe(true);
    expect(toutEnClickCollect([{ variant: VARIANTE_CLICK_COLLECT }, { variant: "Mondial Relay" }])).toBe(false);
    expect(toutEnClickCollect([])).toBe(false);
  });
});
