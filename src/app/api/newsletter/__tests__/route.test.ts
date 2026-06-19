import { describe, it, expect, vi, beforeEach } from "vitest";

// La logique de la route est testée sans base de données ni Resend : le modèle,
// la connexion, l'envoi d'e-mail et l'auth sont remplacés par des doublures.
const findOne = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock("@/lib/newsletter", () => ({
  sendNewsletterWelcome: vi.fn(async () => {}),
}));
vi.mock("@/models/Newsletter", () => ({
  default: {
    findOne: (...a: unknown[]) => findOne(...a),
    create: (...a: unknown[]) => create(...a),
  },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));

import { POST, GET } from "@/app/api/newsletter/route";
import { sendNewsletterWelcome } from "@/lib/newsletter";

function postReq(body: unknown) {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/newsletter (inscription)", () => {
  it("refuse une adresse invalide (400) sans toucher la base", async () => {
    const res = await POST(postReq({ email: "pas-un-email" }));
    expect(res.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });

  it("crée un nouvel abonné (e-mail normalisé) et envoie le mail de bienvenue", async () => {
    findOne.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({});

    const res = await POST(postReq({ email: "New@Example.com", source: "footer" }));

    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledWith({
      email: "new@example.com",
      source: "footer",
    });
    expect(sendNewsletterWelcome).toHaveBeenCalledWith("new@example.com");
  });

  it("ne crée pas de doublon pour un abonné actif existant", async () => {
    findOne.mockResolvedValueOnce({ status: "active" });

    const res = await POST(postReq({ email: "dup@example.com" }));
    const json = await res.json();

    expect(json.alreadySubscribed).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it("réactive un ancien désabonné", async () => {
    const save = vi.fn(async () => {});
    const existing = { status: "unsubscribed", save };
    findOne.mockResolvedValueOnce(existing);

    const res = await POST(postReq({ email: "retour@example.com" }));
    const json = await res.json();

    expect(existing.status).toBe("active");
    expect(save).toHaveBeenCalledTimes(1);
    expect(json.alreadySubscribed).toBe(true);
  });

  it("n'échoue pas l'inscription si l'e-mail de bienvenue plante", async () => {
    findOne.mockResolvedValueOnce(null);
    create.mockResolvedValueOnce({});
    vi.mocked(sendNewsletterWelcome).mockRejectedValueOnce(new Error("resend down"));

    const res = await POST(postReq({ email: "robuste@example.com" }));
    expect(res.status).toBe(201);
  });
});

describe("GET /api/newsletter (liste admin)", () => {
  it("rejette les visiteurs non authentifiés (401)", async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
