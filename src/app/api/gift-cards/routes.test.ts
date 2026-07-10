import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
  type Mock,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";

// Connexion gérée par le test ; I/O externe neutralisée.
vi.mock("@/lib/db", () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/resend", () => ({ sendEmail: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/giftcard-pdf", () => ({
  renderGiftCardPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("")),
}));
vi.mock("@/lib/stripe", () => ({
  verifyGiftCardPayment: vi.fn(),
  isStripeConfigured: vi.fn().mockResolvedValue(false),
}));
// Auth mockée : on pilote la session (admin ou anonyme) par test.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import GiftCard from "@/models/GiftCard";
import SiteSettings from "@/models/SiteSettings";
import { auth } from "@/lib/auth";
import { verifyGiftCardPayment } from "@/lib/stripe";

import { GET as listGET, POST as createPOST } from "./route";
import { POST as redeemPOST } from "./redeem/route";
import { POST as checkBalancePOST } from "./check-balance/route";
import { POST as purchasePOST } from "./purchase/route";
import { GET as detailGET } from "./[id]/route";
import { PATCH as cancelPATCH } from "./[id]/cancel/route";
import { PATCH as reactivatePATCH } from "./[id]/reactivate/route";

const authMock = auth as unknown as Mock;
const verifyMock = verifyGiftCardPayment as unknown as Mock;

const ADMIN = {
  user: {
    id: new mongoose.Types.ObjectId().toString(),
    role: "admin",
    name: "Admin",
    email: "admin@test.fr",
  },
};

function post(url: string, body: unknown): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
function patch(url: string): NextRequest {
  return new NextRequest(url, { method: "PATCH" });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await GiftCard.init();
  // Cartes cadeaux activées (le gate de la route purchase le vérifie).
  await SiteSettings.create({
    shopName: "Test Shop",
    contactEmail: "shop@test.fr",
    giftCards: { enabled: true },
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await GiftCard.deleteMany({});
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
describe("routes admin — auth", () => {
  it("GET /api/gift-cards → 401 sans session", async () => {
    authMock.mockResolvedValue(null);
    const res = await listGET(new NextRequest("http://t/api/gift-cards"));
    expect(res.status).toBe(401);
  });

  it("POST /api/gift-cards/redeem → 401 pour un non-admin", async () => {
    authMock.mockResolvedValue({ user: { id: "x", role: "customer" } });
    const res = await redeemPOST(post("http://t/api/gift-cards/redeem", { code: "GC-AA-BB" }));
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("POST /api/gift-cards (création admin)", () => {
  it("crée une carte en euros et renvoie 201", async () => {
    authMock.mockResolvedValue(ADMIN);
    const res = await createPOST(
      post("http://t/api/gift-cards", {
        initialAmount: 40,
        source: "on_site",
        recipient: { name: "Bob" },
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.initialAmount).toBe(40);
    expect(body.balance).toBe(40);
    expect(body.source).toBe("on_site");
    expect(body.status).toBe("active");
  });

  it("refuse un montant hors bornes (400)", async () => {
    authMock.mockResolvedValue(ADMIN);
    const res = await createPOST(
      post("http://t/api/gift-cards", { initialAmount: 3 })
    );
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("cycle admin : redeem / cancel / reactivate / detail", () => {
  async function makeCard(amount = 30) {
    authMock.mockResolvedValue(ADMIN);
    const res = await createPOST(
      post("http://t/api/gift-cards", { initialAmount: amount })
    );
    return res.json();
  }

  it("redeem consomme la carte et renvoie le montant", async () => {
    const card = await makeCard(30);
    authMock.mockResolvedValue(ADMIN);
    const res = await redeemPOST(
      post("http://t/api/gift-cards/redeem", { code: card.code })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.amount).toBe(30);
    expect(body.status).toBe("used");
  });

  it("redeem d'un code inexistant → 404", async () => {
    authMock.mockResolvedValue(ADMIN);
    const res = await redeemPOST(
      post("http://t/api/gift-cards/redeem", { code: "GC-ZZZZ-ZZZZ" })
    );
    expect(res.status).toBe(404);
  });

  it("cancel puis reactivate rétablit la carte", async () => {
    const card = await makeCard(50);
    authMock.mockResolvedValue(ADMIN);

    const c = await cancelPATCH(patch(`http://t/x`), params(card._id));
    expect(c.status).toBe(200);
    expect((await c.json()).status).toBe("cancelled");

    const r = await reactivatePATCH(patch(`http://t/x`), params(card._id));
    expect(r.status).toBe(200);
    const rBody = await r.json();
    expect(rBody.status).toBe("active");
    expect(rBody.balance).toBe(50);
  });

  it("reactivate d'une carte non annulée → 400", async () => {
    const card = await makeCard(20);
    authMock.mockResolvedValue(ADMIN);
    const res = await reactivatePATCH(patch(`http://t/x`), params(card._id));
    expect(res.status).toBe(400);
  });

  it("detail renvoie la carte / 404 sinon", async () => {
    const card = await makeCard(15);
    authMock.mockResolvedValue(ADMIN);
    const ok = await detailGET(new NextRequest("http://t/x"), params(card._id));
    expect(ok.status).toBe(200);
    const missing = await detailGET(
      new NextRequest("http://t/x"),
      params(new mongoose.Types.ObjectId().toString())
    );
    expect(missing.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("POST /api/gift-cards/check-balance (public)", () => {
  it("renvoie le solde d'une carte active", async () => {
    authMock.mockResolvedValue(ADMIN);
    const card = await (
      await createPOST(post("http://t/api/gift-cards", { initialAmount: 25 }))
    ).json();

    const res = await checkBalancePOST(
      post("http://t/api/gift-cards/check-balance", { code: card.code })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).balance).toBe(25);
  });

  it("code inexistant → 404 ; code vide → 400", async () => {
    const missing = await checkBalancePOST(
      post("http://t/api/gift-cards/check-balance", { code: "GC-ZZZZ-ZZZZ" })
    );
    expect(missing.status).toBe(404);
    const empty = await checkBalancePOST(
      post("http://t/api/gift-cards/check-balance", { code: "" })
    );
    expect(empty.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("POST /api/gift-cards/purchase (public)", () => {
  it("crée la carte quand le paiement est vérifié (201)", async () => {
    authMock.mockResolvedValue(null);
    verifyMock.mockResolvedValue({ ok: true, testMode: true, receiptUrl: null });
    const res = await purchasePOST(
      post("http://t/api/gift-cards/purchase", {
        amount: 50,
        purchaser: { name: "Jean", email: "jean@ex.fr" },
        stripePaymentIntentId: "pi_test_ok",
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.amount).toBe(50);
    expect(body.code).toMatch(/^GC-/);
  });

  it("refuse un paiement non vérifié (402)", async () => {
    authMock.mockResolvedValue(null);
    verifyMock.mockResolvedValue({
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: "Montant du paiement incorrect",
    });
    const res = await purchasePOST(
      post("http://t/api/gift-cards/purchase", {
        amount: 50,
        purchaser: { name: "Jean", email: "jean@ex.fr" },
        stripePaymentIntentId: "pi_bad",
      })
    );
    expect(res.status).toBe(402);
  });

  it("est idempotent : un même PaymentIntent ne crée qu'une carte", async () => {
    authMock.mockResolvedValue(null);
    verifyMock.mockResolvedValue({ ok: true, testMode: true, receiptUrl: null });
    const payload = {
      amount: 20,
      purchaser: { name: "Jean", email: "jean@ex.fr" },
      stripePaymentIntentId: "pi_idem",
    };
    const a = await (await purchasePOST(post("http://t/x", payload))).json();
    const b = await (await purchasePOST(post("http://t/x", payload))).json();
    expect(String(a.id)).toBe(String(b.id));
    expect(await GiftCard.countDocuments({ stripePaymentIntentId: "pi_idem" })).toBe(1);
  });

  it("refuse un id de paiement mal formé (400)", async () => {
    authMock.mockResolvedValue(null);
    const res = await purchasePOST(
      post("http://t/api/gift-cards/purchase", {
        amount: 20,
        purchaser: { name: "Jean", email: "jean@ex.fr" },
        stripePaymentIntentId: "xx_nope",
      })
    );
    expect(res.status).toBe(400);
  });
});
