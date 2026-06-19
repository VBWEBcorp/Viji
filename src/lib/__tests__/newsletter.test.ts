import { describe, it, expect, vi, beforeEach } from "vitest";

// On isole la logique testée (jetons de désinscription + rendu des e-mails) de
// l'envoi réel : Resend et la base de données ne sont jamais sollicités.
vi.mock("@/lib/resend", () => ({
  sendEmail: vi.fn(async () => ({ id: "mock-email" })),
  sendBatchEmails: vi.fn(async (msgs: { to: string }[]) => ({
    sent: msgs.length,
    failed: 0,
  })),
  isResendConfigured: vi.fn(async () => true),
}));

import { sendEmail, sendBatchEmails } from "@/lib/resend";
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
  sendNewsletterWelcome,
  sendCampaign,
} from "@/lib/newsletter";

const mockedSendEmail = vi.mocked(sendEmail);
const mockedSendBatch = vi.mocked(sendBatchEmails);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("unsubscribeToken / verifyUnsubscribeToken", () => {
  it("génère un jeton déterministe de 32 caractères hexadécimaux", () => {
    const token = unsubscribeToken("alice@example.com");
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(unsubscribeToken("alice@example.com")).toBe(token);
  });

  it("est insensible à la casse de l'e-mail", () => {
    expect(unsubscribeToken("Alice@Example.COM")).toBe(
      unsubscribeToken("alice@example.com")
    );
  });

  it("valide un jeton correctement signé", () => {
    const email = "bob@example.com";
    expect(verifyUnsubscribeToken(email, unsubscribeToken(email))).toBe(true);
  });

  it("rejette un jeton falsifié (même longueur)", () => {
    const email = "bob@example.com";
    const good = unsubscribeToken(email);
    const tampered = (good[0] === "0" ? "1" : "0") + good.slice(1);
    expect(verifyUnsubscribeToken(email, tampered)).toBe(false);
  });

  it("rejette un jeton de mauvaise longueur sans lever d'exception", () => {
    expect(verifyUnsubscribeToken("bob@example.com", "trop-court")).toBe(false);
  });

  it("rejette le jeton émis pour un autre e-mail", () => {
    expect(
      verifyUnsubscribeToken(
        "carol@example.com",
        unsubscribeToken("dave@example.com")
      )
    ).toBe(false);
  });
});

describe("sendNewsletterWelcome", () => {
  it("envoie un e-mail de bienvenue avec un lien de désinscription signé", async () => {
    await sendNewsletterWelcome("alice@example.com");

    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
    const arg = mockedSendEmail.mock.calls[0][0];
    expect(arg.to).toBe("alice@example.com");
    expect(arg.subject).toContain("Bienvenue");

    const token = unsubscribeToken("alice@example.com");
    expect(arg.html).toContain(
      `/api/newsletter/unsubscribe?e=alice%40example.com&t=${token}`
    );
  });
});

describe("sendCampaign", () => {
  it("construit un e-mail par destinataire avec son propre lien de désinscription", async () => {
    const res = await sendCampaign(
      ["a@x.com", "b@y.com"],
      "Nouveautés du mois",
      "Bonjour !\n\nDécouvrez nos nouveautés."
    );

    expect(res).toEqual({ sent: 2, failed: 0, total: 2 });
    expect(mockedSendBatch).toHaveBeenCalledTimes(1);

    const msgs = mockedSendBatch.mock.calls[0][0];
    expect(msgs).toHaveLength(2);
    expect(msgs[0].to).toBe("a@x.com");
    expect(msgs[0].subject).toBe("Nouveautés du mois");
    // Chaque message porte le jeton du destinataire correspondant.
    expect(msgs[0].html).toContain(unsubscribeToken("a@x.com"));
    expect(msgs[1].html).toContain(unsubscribeToken("b@y.com"));
    // Sujet et corps présents dans le rendu HTML.
    expect(msgs[0].html).toContain("Nouveautés du mois");
    expect(msgs[0].html).toContain("Bonjour");
  });

  it("échappe le HTML de l'objet et du message (anti-injection)", async () => {
    await sendCampaign(
      ["a@x.com"],
      "<script>alert(1)</script>",
      "<b>gras</b> & cie"
    );

    const html = mockedSendBatch.mock.calls[0][0][0].html;
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp; cie");
  });

  it("reste sûr sans destinataire (total = 0)", async () => {
    const res = await sendCampaign([], "Objet", "Message");
    expect(res.total).toBe(0);
    expect(res.sent).toBe(0);
  });
});
