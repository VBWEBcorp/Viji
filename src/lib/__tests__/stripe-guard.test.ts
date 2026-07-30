import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * Garde-fou anti mode test.
 *
 * Contexte : la production a tourné plusieurs mois sur des clés Stripe de test.
 * Les clients voyaient un écran de confirmation et recevaient un email
 * « Payé en ligne », sans qu'aucun euro ne soit jamais débité. Ces tests
 * verrouillent le comportement pour que la situation ne puisse pas revenir
 * silencieusement.
 */

const keys = {
  stripeSecretKey: "sk_test_xxx",
  stripePublishableKey: "pk_test_xxx",
  stripeWebhookSecret: "",
  sendcloudPublicKey: "",
  sendcloudSecretKey: "",
  resendApiKey: "",
  resendFromEmail: "",
};

vi.mock("@/lib/apikeys", () => ({
  getApiKeys: vi.fn(async () => keys),
  invalidateApiKeysCache: vi.fn(),
}));

const {
  assertStripeLiveInProduction,
  isTestPaymentInProduction,
  isStripeLive,
  STRIPE_TEST_MODE_ERROR,
} = await import("@/lib/stripe");

afterEach(() => {
  vi.unstubAllEnvs();
  keys.stripeSecretKey = "sk_test_xxx";
});

describe("isStripeLive", () => {
  it("est faux avec une clé de test", async () => {
    expect(await isStripeLive()).toBe(false);
  });

  it("est vrai avec une clé live", async () => {
    keys.stripeSecretKey = "sk_live_xxx";
    expect(await isStripeLive()).toBe(true);
  });
});

describe("assertStripeLiveInProduction", () => {
  it("laisse passer le mode test en développement", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(await assertStripeLiveInProduction()).toBeNull();
  });

  it("bloque une clé de test en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await assertStripeLiveInProduction()).toBe(STRIPE_TEST_MODE_ERROR);
  });

  it("laisse passer une clé live en production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    keys.stripeSecretKey = "sk_live_xxx";
    expect(await assertStripeLiveInProduction()).toBeNull();
  });

  it("ne divulgue aucun détail technique au client", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const message = await assertStripeLiveInProduction();
    expect(message).not.toMatch(/sk_|pk_|test mode|Stripe/i);
  });
});

describe("isTestPaymentInProduction", () => {
  it("accepte un paiement de test en développement", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isTestPaymentInProduction({ livemode: false })).toBe(false);
  });

  it("refuse un paiement de test en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isTestPaymentInProduction({ livemode: false })).toBe(true);
  });

  it("accepte un vrai paiement en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isTestPaymentInProduction({ livemode: true })).toBe(false);
  });
});
