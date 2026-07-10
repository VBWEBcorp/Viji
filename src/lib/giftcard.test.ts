import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
  type Mock,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// La connexion est gérée par le test (serveur Mongo en mémoire) : connectDB() no-op.
vi.mock("@/lib/db", () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
// Emails + rendu PDF neutralisés : on teste la logique métier, pas l'I/O externe.
vi.mock("@/lib/resend", () => ({ sendEmail: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/giftcard-pdf", () => ({
  renderGiftCardPdfBuffer: vi.fn().mockResolvedValue(Buffer.from("")),
}));
// La vérification Stripe est mockée pour piloter les scénarios d'achat.
vi.mock("@/lib/stripe", () => ({ verifyGiftCardPayment: vi.fn() }));

import GiftCard from "@/models/GiftCard";
import {
  createGiftCard,
  checkBalance,
  redeemOnSite,
  cancelGiftCard,
  reactivateGiftCard,
  purchaseGiftCard,
  getAllGiftCards,
  getGiftCardById,
  GiftCardError,
  MIN_AMOUNT,
  MAX_AMOUNT,
  GIFT_CARD_PRESETS,
} from "@/lib/giftcard";
import { verifyGiftCardPayment } from "@/lib/stripe";

const mockVerify = verifyGiftCardPayment as unknown as Mock;

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Force la construction des index (dont l'unique partiel stripePaymentIntentId).
  await GiftCard.init();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await GiftCard.deleteMany({});
  vi.clearAllMocks();
});

const ADMIN = { id: new mongoose.Types.ObjectId().toString(), name: "Admin Test" };

// ─────────────────────────────────────────────────────────────────────────
describe("createGiftCard", () => {
  it("crée une carte active, solde = montant initial, tx purchase", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    expect(card.status).toBe("active");
    expect(card.initialAmount).toBe(30);
    expect(card.balance).toBe(30);
    expect(card.currency).toBe("EUR");
    expect(card.source).toBe("online");
    expect(card.transactions).toHaveLength(1);
    expect(card.transactions[0].type).toBe("purchase");
    expect(card.transactions[0].balanceAfter).toBe(30);
  });

  it("génère un code au format GC-XXXX-XXXX", async () => {
    const card = await createGiftCard({ initialAmount: 50 });
    expect(card.code).toMatch(/^GC-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("applique une expiration à +1 an par défaut", async () => {
    const before = new Date();
    const card = await createGiftCard({ initialAmount: 20 });
    expect(card.expiresAt).toBeTruthy();
    const expected = new Date(before);
    expected.setFullYear(expected.getFullYear() + 1);
    // tolérance : même année/mois
    expect(card.expiresAt!.getFullYear()).toBe(expected.getFullYear());
  });

  it("source admin quand adminId fourni, tx tracée avec performedBy", async () => {
    const card = await createGiftCard(
      { initialAmount: 40, adminName: ADMIN.name },
      ADMIN.id
    );
    expect(card.source).toBe("admin");
    expect(String(card.createdByAdmin)).toBe(ADMIN.id);
    expect(card.transactions[0].performedBy?.name).toBe(ADMIN.name);
  });

  it("respecte une source explicite (on_site, avoir…)", async () => {
    const card = await createGiftCard({ initialAmount: 25, source: "on_site" }, ADMIN.id);
    expect(card.source).toBe("on_site");
  });

  it("codes uniques sur plusieurs créations", async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 25; i++) {
      const c = await createGiftCard({ initialAmount: 10 });
      codes.add(c.code);
    }
    expect(codes.size).toBe(25);
  });

  it("ne stocke pas d'ObjectId invalide pour un acheteur non-ObjectId", async () => {
    const card = await createGiftCard({
      initialAmount: 15,
      purchasedBy: { userId: "not-an-objectid", email: "a@b.fr", name: "A" },
    });
    expect(card.purchasedBy.userId).toBeNull();
    expect(card.purchasedBy.email).toBe("a@b.fr");
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("checkBalance", () => {
  it("retourne le solde d'une carte active", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    const res = await checkBalance(card.code);
    expect(res.balance).toBe(30);
    expect(res.status).toBe("active");
    expect(res.code).toBe(card.code);
  });

  it("est insensible à la casse et aux espaces", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    const res = await checkBalance(`  ${card.code.toLowerCase()}  `);
    expect(res.balance).toBe(30);
  });

  it("404 si carte introuvable", async () => {
    await expect(checkBalance("GC-ZZZZ-ZZZZ")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("auto-expire une carte dont la date est dépassée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    card.expiresAt = new Date(Date.now() - 1000);
    await card.save();
    await expect(checkBalance(card.code)).rejects.toThrow(/expirée/);
    const reloaded = await GiftCard.findById(card._id);
    expect(reloaded!.status).toBe("expired");
  });

  it("refuse une carte annulée avec le bon libellé", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(card._id.toString(), ADMIN);
    await expect(checkBalance(card.code)).rejects.toThrow(/annulée/);
  });

  it("refuse une carte utilisée avec le libellé « épuisée »", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await redeemOnSite(card.code, ADMIN);
    await expect(checkBalance(card.code)).rejects.toThrow(/épuisée/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("redeemOnSite (usage unique)", () => {
  it("consomme la totalité du solde et passe la carte à 'used'", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    const redeemed = await redeemOnSite(card.code, ADMIN, "Atelier du 10/07");
    expect(redeemed.status).toBe("used");
    expect(redeemed.balance).toBe(0);
    const tx = redeemed.transactions.find((t) => t.type === "redemption_on_site");
    expect(tx).toBeTruthy();
    expect(tx!.amount).toBe(30);
    expect(tx!.balanceAfter).toBe(0);
    expect(tx!.description).toBe("Atelier du 10/07");
  });

  it("404 si carte introuvable", async () => {
    await expect(redeemOnSite("GC-ZZZZ-ZZZZ", ADMIN)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("refuse une carte déjà utilisée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await redeemOnSite(card.code, ADMIN);
    await expect(redeemOnSite(card.code, ADMIN)).rejects.toThrow(/déjà utilisée/);
  });

  it("auto-expire puis refuse une carte périmée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    card.expiresAt = new Date(Date.now() - 1000);
    await card.save();
    await expect(redeemOnSite(card.code, ADMIN)).rejects.toThrow(/expirée/);
    const reloaded = await GiftCard.findById(card._id);
    expect(reloaded!.status).toBe("expired");
  });

  it("refuse une carte annulée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(card._id.toString(), ADMIN);
    await expect(redeemOnSite(card.code, ADMIN)).rejects.toThrow(/annulée/);
  });

  it("empêche la double utilisation concurrente (une seule gagne)", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    const results = await Promise.allSettled([
      redeemOnSite(card.code, ADMIN),
      redeemOnSite(card.code, ADMIN),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const reloaded = await GiftCard.findById(card._id);
    expect(reloaded!.status).toBe("used");
    // Une seule transaction d'utilisation malgré les deux appels.
    expect(
      reloaded!.transactions.filter((t) => t.type === "redemption_on_site")
    ).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("cancelGiftCard", () => {
  it("annule, met le solde à 0 et trace la transaction", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    const cancelled = await cancelGiftCard(card._id.toString(), ADMIN);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.balance).toBe(0);
    const tx = cancelled.transactions.find((t) => t.type === "cancellation");
    expect(tx!.amount).toBe(30); // montant voilé = solde au moment de l'annulation
    expect(tx!.balanceAfter).toBe(0);
  });

  it("refuse une carte déjà annulée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(card._id.toString(), ADMIN);
    await expect(
      cancelGiftCard(card._id.toString(), ADMIN)
    ).rejects.toThrow(/déjà annulée/);
  });

  it("404 si carte introuvable", async () => {
    await expect(
      cancelGiftCard(new mongoose.Types.ObjectId().toString(), ADMIN)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("reactivateGiftCard", () => {
  it("restaure le solde voilé par la dernière annulation et réactive", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(card._id.toString(), ADMIN);
    const reactivated = await reactivateGiftCard(card._id.toString(), ADMIN);
    expect(reactivated.status).toBe("active");
    expect(reactivated.balance).toBe(30);
    expect(
      reactivated.transactions.some((t) => t.type === "reactivation")
    ).toBe(true);
  });

  it("une carte annulée alors qu'elle était épuisée redevient 'used' (solde 0)", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await redeemOnSite(card.code, ADMIN); // solde 0, status used
    await cancelGiftCard(card._id.toString(), ADMIN); // annule (solde voilé = 0)
    const reactivated = await reactivateGiftCard(card._id.toString(), ADMIN);
    expect(reactivated.balance).toBe(0);
    expect(reactivated.status).toBe("used");
  });

  it("refuse de réactiver une carte non annulée", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await expect(
      reactivateGiftCard(card._id.toString(), ADMIN)
    ).rejects.toThrow(/annulée peut être réactivée/);
  });

  it("cycle annuler → réactiver → réutilisable sur place", async () => {
    const card = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(card._id.toString(), ADMIN);
    await reactivateGiftCard(card._id.toString(), ADMIN);
    const redeemed = await redeemOnSite(card.code, ADMIN);
    expect(redeemed.status).toBe("used");
    expect(redeemed.balance).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("purchaseGiftCard", () => {
  it("crée une carte online après paiement vérifié", async () => {
    mockVerify.mockResolvedValue({ ok: true, testMode: false, receiptUrl: "https://r" });
    const card = await purchaseGiftCard(
      { amount: 50, purchaser: { name: "Jean", email: "jean@ex.fr" } },
      "pi_test_123"
    );
    expect(card.initialAmount).toBe(50);
    expect(card.source).toBe("online");
    expect(card.stripePaymentIntentId).toBe("pi_test_123");
    expect(card.stripeReceiptUrl).toBe("https://r");
    expect(mockVerify).toHaveBeenCalledWith("pi_test_123", 50);
  });

  it("est idempotent : même PaymentIntent ⇒ même carte, aucun doublon", async () => {
    mockVerify.mockResolvedValue({ ok: true, testMode: false, receiptUrl: null });
    const first = await purchaseGiftCard(
      { amount: 50, purchaser: { name: "Jean", email: "jean@ex.fr" } },
      "pi_dup_1"
    );
    const second = await purchaseGiftCard(
      { amount: 50, purchaser: { name: "Jean", email: "jean@ex.fr" } },
      "pi_dup_1"
    );
    expect(String(second._id)).toBe(String(first._id));
    expect(await GiftCard.countDocuments({ stripePaymentIntentId: "pi_dup_1" })).toBe(1);
    // Sur la 2e requête, on retourne l'existant sans revérifier le paiement.
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  it("échoue (402) si le paiement n'est pas vérifié", async () => {
    mockVerify.mockResolvedValue({
      ok: false,
      testMode: false,
      receiptUrl: null,
      reason: "Montant du paiement incorrect",
    });
    await expect(
      purchaseGiftCard(
        { amount: 50, purchaser: { name: "Jean", email: "jean@ex.fr" } },
        "pi_bad"
      )
    ).rejects.toMatchObject({ statusCode: 402, message: "Montant du paiement incorrect" });
    expect(await GiftCard.countDocuments({})).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("modèle : index unique partiel stripePaymentIntentId", () => {
  it("autorise plusieurs cartes SANS PaymentIntent (admin/sur place)", async () => {
    await createGiftCard({ initialAmount: 10 }, ADMIN.id);
    await createGiftCard({ initialAmount: 20 }, ADMIN.id);
    expect(await GiftCard.countDocuments({})).toBe(2);
  });

  it("interdit deux cartes avec le même PaymentIntent", async () => {
    await GiftCard.create({
      code: "GC-AAAA-BBBB",
      initialAmount: 10,
      balance: 10,
      stripePaymentIntentId: "pi_unique",
      transactions: [{ type: "purchase", amount: 10, balanceAfter: 10 }],
    });
    await expect(
      GiftCard.create({
        code: "GC-CCCC-DDDD",
        initialAmount: 10,
        balance: 10,
        stripePaymentIntentId: "pi_unique",
        transactions: [{ type: "purchase", amount: 10, balanceAfter: 10 }],
      })
    ).rejects.toMatchObject({ code: 11000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("getAllGiftCards / getGiftCardById", () => {
  beforeEach(async () => {
    await createGiftCard({ initialAmount: 10, recipient: { email: "alice@ex.fr", name: "Alice" } });
    await createGiftCard({ initialAmount: 20, recipient: { email: "bob@ex.fr", name: "Bob" } });
    const c = await createGiftCard({ initialAmount: 30 });
    await cancelGiftCard(c._id.toString(), ADMIN);
  });

  it("liste paginée avec total et pages", async () => {
    const res = await getAllGiftCards({}, { page: 1, limit: 2 });
    expect(res.pagination.total).toBe(3);
    expect(res.pagination.pages).toBe(2);
    expect(res.giftCards).toHaveLength(2);
  });

  it("filtre par statut", async () => {
    const res = await getAllGiftCards({ status: "cancelled" }, {});
    expect(res.giftCards).toHaveLength(1);
    expect(res.giftCards[0].status).toBe("cancelled");
  });

  it("recherche par email destinataire (insensible à la casse)", async () => {
    const res = await getAllGiftCards({ search: "ALICE" }, {});
    expect(res.giftCards).toHaveLength(1);
    expect(res.giftCards[0].recipient.email).toBe("alice@ex.fr");
  });

  it("la recherche échappe les métacaractères regex", async () => {
    const res = await getAllGiftCards({ search: "a.*b" }, {});
    expect(res.giftCards).toHaveLength(0);
  });

  it("getGiftCardById renvoie la carte / 404 sinon", async () => {
    const created = await createGiftCard({ initialAmount: 99 });
    const found = await getGiftCardById(created._id.toString());
    expect(found.initialAmount).toBe(99);
    await expect(
      getGiftCardById(new mongoose.Types.ObjectId().toString())
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

// ─────────────────────────────────────────────────────────────────────────
describe("constantes métier (alignées ARTI)", () => {
  it("bornes 5€ – 500€ et presets 10→100", () => {
    expect(MIN_AMOUNT).toBe(5);
    expect(MAX_AMOUNT).toBe(500);
    expect(GIFT_CARD_PRESETS).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  });

  it("GiftCardError porte un statusCode", () => {
    const e = new GiftCardError("x", 404);
    expect(e.statusCode).toBe(404);
    expect(e.name).toBe("GiftCardError");
  });
});
