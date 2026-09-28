import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Garde-fou du jeu de donnees de demonstration.
 *
 * Contexte : `ensureDevSeed` ne remplit pas seulement une base vide, il reecrit
 * les noms, descriptions, prix et images des produits du catalogue et recree
 * les sessions d'atelier supprimees. Tant qu'il s'executait des que
 * NODE_ENV n'etait pas « production », un simple `next dev` lance sur un poste
 * pointant vers la base Atlas reelle modifiait le site en ligne. Ces tests
 * verrouillent la regle : base locale uniquement, sauf demande explicite.
 */

vi.mock("mongoose", () => ({ default: { connect: vi.fn(), connection: {} } }));

const { seedAutorise } = await import("@/lib/db");

afterEach(() => {
  vi.unstubAllEnvs();
  const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
  spy.mockRestore();
});

describe("bases locales", () => {
  it("autorise un MongoDB installe sur le poste", () => {
    expect(seedAutorise("mongodb://localhost:27017/viji")).toBe(true);
  });

  it("autorise le serveur en memoire", () => {
    expect(seedAutorise("mongodb://127.0.0.1:41235/test")).toBe(true);
  });

  it("autorise IPv6 en boucle locale", () => {
    expect(seedAutorise("mongodb://[::1]:27017/viji")).toBe(true);
  });
});

describe("bases distantes", () => {
  it("refuse une base Atlas", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      seedAutorise("mongodb+srv://vbweb:motdepasse@vbweb.mdm1f65.mongodb.net/viji")
    ).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("ne se laisse pas berner par un nom d'hote qui contient localhost", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(seedAutorise("mongodb+srv://user:pass@localhost.example.com/viji")).toBe(false);
    warn.mockRestore();
  });
});

describe("derogation explicite", () => {
  it("autorise une base distante quand ALLOW_DEV_SEED vaut 1", () => {
    vi.stubEnv("ALLOW_DEV_SEED", "1");
    expect(seedAutorise("mongodb+srv://u:p@cluster.mongodb.net/test")).toBe(true);
  });

  it("n'accepte pas une autre valeur que 1", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("ALLOW_DEV_SEED", "true");
    expect(seedAutorise("mongodb+srv://u:p@cluster.mongodb.net/test")).toBe(false);
    warn.mockRestore();
  });
});
