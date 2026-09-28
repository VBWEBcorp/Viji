import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifieSignatureResend,
  STATUT_PAR_EVENEMENT,
  remplaceStatut,
} from "@/lib/resend-webhook";

/**
 * Webhook de suivi de reception.
 *
 * Son role est de repondre a « la cliente l'a-t-elle vraiment recu ? ». Une
 * signature mal verifiee retournerait le probleme : n'importe qui pourrait
 * ecrire « recu » dans le journal, et on croirait a tort que tout va bien.
 */

const SECRET_BRUT = crypto.randomBytes(24).toString("base64");
const SECRET = `whsec_${SECRET_BRUT}`;

function signe(corps: string, id: string, timestamp: string, secret = SECRET_BRUT) {
  const cle = Buffer.from(secret, "base64");
  return (
    "v1," +
    crypto.createHmac("sha256", cle).update(`${id}.${timestamp}.${corps}`).digest("base64")
  );
}

const MAINTENANT = new Date("2026-09-01T10:00:00Z");
const HORODATAGE = String(Math.floor(MAINTENANT.getTime() / 1000));
const CORPS = JSON.stringify({
  type: "email.delivered",
  data: { email_id: "0ed59735-8d2b-4a4d-a883-c7f4678b79b0" },
});

describe("signature valide", () => {
  it("accepte un appel correctement signé", () => {
    const r = verifieSignatureResend(
      CORPS,
      { id: "msg_1", timestamp: HORODATAGE, signature: signe(CORPS, "msg_1", HORODATAGE) },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(true);
  });

  it("accepte quand plusieurs signatures sont fournies (rotation de secret)", () => {
    const bonne = signe(CORPS, "msg_1", HORODATAGE);
    const autre = signe(CORPS, "msg_1", HORODATAGE, crypto.randomBytes(24).toString("base64"));
    const r = verifieSignatureResend(
      CORPS,
      { id: "msg_1", timestamp: HORODATAGE, signature: `${autre} ${bonne}` },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(true);
  });
});

describe("signature refusée", () => {
  it("refuse un corps modifié après signature", () => {
    const sig = signe(CORPS, "msg_1", HORODATAGE);
    const falsifie = JSON.stringify({
      type: "email.delivered",
      data: { email_id: "autre-message" },
    });
    const r = verifieSignatureResend(
      falsifie,
      { id: "msg_1", timestamp: HORODATAGE, signature: sig },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(false);
  });

  it("refuse une signature calculée avec un autre secret", () => {
    const r = verifieSignatureResend(
      CORPS,
      {
        id: "msg_1",
        timestamp: HORODATAGE,
        signature: signe(CORPS, "msg_1", HORODATAGE, crypto.randomBytes(24).toString("base64")),
      },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(false);
  });

  it("refuse le rejeu d'un appel ancien", () => {
    const vieux = String(Math.floor(MAINTENANT.getTime() / 1000) - 3600);
    const r = verifieSignatureResend(
      CORPS,
      { id: "msg_1", timestamp: vieux, signature: signe(CORPS, "msg_1", vieux) },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(false);
    expect(r.raison).toContain("ancien");
  });

  it("refuse quand les en-têtes manquent", () => {
    const r = verifieSignatureResend(
      CORPS,
      { id: null, timestamp: null, signature: null },
      SECRET,
      MAINTENANT
    );
    expect(r.valide).toBe(false);
  });

  it("refuse quand aucun secret n'est configuré", () => {
    const r = verifieSignatureResend(
      CORPS,
      { id: "msg_1", timestamp: HORODATAGE, signature: signe(CORPS, "msg_1", HORODATAGE) },
      "",
      MAINTENANT
    );
    expect(r.valide).toBe(false);
  });
});

describe("correspondance des événements", () => {
  it("traduit les événements Resend en statuts lisibles", () => {
    expect(STATUT_PAR_EVENEMENT["email.delivered"]).toBe("remis");
    expect(STATUT_PAR_EVENEMENT["email.bounced"]).toBe("rejete");
    expect(STATUT_PAR_EVENEMENT["email.complained"]).toBe("plainte");
    expect(STATUT_PAR_EVENEMENT["email.opened"]).toBeUndefined();
  });
});

describe("ordre des statuts", () => {
  it("enregistre le premier statut connu", () => {
    expect(remplaceStatut(undefined, "accepte")).toBe(true);
  });

  it("laisse progresser vers un état plus avancé", () => {
    expect(remplaceStatut("accepte", "remis")).toBe(true);
    expect(remplaceStatut("remis", "plainte")).toBe(true);
  });

  it("ne redescend pas d'un rejet vers une simple acceptation", () => {
    // Les evenements peuvent arriver dans le desordre : un « pris en charge »
    // en retard ne doit pas effacer un rejet deja constate.
    expect(remplaceStatut("rejete", "accepte")).toBe(false);
    expect(remplaceStatut("remis", "differe")).toBe(false);
  });
});
