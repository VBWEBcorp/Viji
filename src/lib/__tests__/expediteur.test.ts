import { describe, it, expect, vi, afterEach } from "vitest";
import {
  resoudreExpediteur,
  estExpediteurBacASable,
  extraitAdresse,
  domaineDuSite,
} from "@/lib/expediteur";

/**
 * Choix de l'adresse d'expedition.
 *
 * Le site a tourne des mois avec `onboarding@resend.dev` : la commercante
 * recevait ses notifications (elle est titulaire du compte Resend), et chaque
 * email destine a une cliente etait refuse par un 403 que personne ne voyait.
 * Ces tests verrouillent le garde-fou qui rend ce reglage inoffensif.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe("extraitAdresse", () => {
  it("lit l'adresse entre chevrons", () => {
    expect(extraitAdresse("Entre Maman et Moi <contact@exemple.fr>")).toBe(
      "contact@exemple.fr"
    );
  });

  it("accepte une adresse nue", () => {
    expect(extraitAdresse("  Contact@Exemple.FR ")).toBe("contact@exemple.fr");
  });
});

describe("estExpediteurBacASable", () => {
  it("reconnaît l'adresse d'essai de Resend", () => {
    expect(estExpediteurBacASable("Boutique <onboarding@resend.dev>")).toBe(true);
    expect(estExpediteurBacASable("onboarding@resend.dev")).toBe(true);
  });

  it("reconnaît un sous-domaine d'essai", () => {
    expect(estExpediteurBacASable("x@mail.resend.dev")).toBe(true);
  });

  it("laisse passer un vrai domaine", () => {
    expect(estExpediteurBacASable("Boutique <contact@entre-maman-et-moi.fr>")).toBe(false);
  });

  it("ne confond pas avec un domaine qui contient le mot", () => {
    expect(estExpediteurBacASable("x@resend.dev.exemple.fr")).toBe(false);
  });
});

describe("domaineDuSite", () => {
  it("extrait le domaine d'une URL de production", () => {
    expect(domaineDuSite("https://entre-maman-et-moi.fr/")).toBe("entre-maman-et-moi.fr");
  });

  it("retire le www et le chemin", () => {
    expect(domaineDuSite("https://www.exemple.fr/boutique")).toBe("exemple.fr");
  });

  it("refuse une adresse locale", () => {
    expect(domaineDuSite("http://localhost:3004")).toBe("");
    expect(domaineDuSite("http://127.0.0.1:3000")).toBe("");
  });

  it("refuse une valeur vide ou sans point", () => {
    expect(domaineDuSite("")).toBe("");
    expect(domaineDuSite("machine-interne")).toBe("");
  });
});

describe("resoudreExpediteur", () => {
  const site = "https://entre-maman-et-moi.fr";

  it("garde l'adresse configurée quand elle est exploitable", () => {
    expect(
      resoudreExpediteur({
        configuree: "Entre Maman et Moi <bonjour@entre-maman-et-moi.fr>",
        nomBoutique: "Entre Maman et Moi",
        urlSite: site,
      })
    ).toBe("Entre Maman et Moi <bonjour@entre-maman-et-moi.fr>");
  });

  it("remplace l'adresse d'essai par le domaine du site", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      resoudreExpediteur({
        configuree: "Entre Maman et Moi <onboarding@resend.dev>",
        nomBoutique: "Entre Maman et Moi",
        urlSite: site,
      })
    ).toBe("Entre Maman et Moi <contact@entre-maman-et-moi.fr>");
    expect(warn).toHaveBeenCalled();
  });

  it("avertit dans les journaux pour que le réglage soit corrigé", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resoudreExpediteur({
      configuree: "onboarding@resend.dev",
      nomBoutique: "Entre Maman et Moi",
      urlSite: site,
    });
    expect(warn.mock.calls[0][0]).toContain("titulaire du compte");
  });

  it("conserve l'adresse d'essai si aucun domaine de site n'est connu", () => {
    // Sans domaine verifiable, remplacer ne ferait qu'echanger un envoi
    // limite contre un envoi impossible.
    expect(
      resoudreExpediteur({
        configuree: "Boutique <onboarding@resend.dev>",
        nomBoutique: "Boutique",
        urlSite: "http://localhost:3004",
      })
    ).toBe("Boutique <onboarding@resend.dev>");
  });

  it("nettoie un nom de boutique qui casserait l'en-tête From", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      resoudreExpediteur({
        configuree: "onboarding@resend.dev",
        nomBoutique: 'Chez "Viji" <pirate@ailleurs.fr>',
        urlSite: site,
      })
    ).toBe("Chez Viji pirate@ailleurs.fr <contact@entre-maman-et-moi.fr>");
    warn.mockRestore();
  });
});
