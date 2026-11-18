import { describe, it, expect } from "vitest";
import { descriptionEnHtml } from "./description-kit";

describe("descriptionEnHtml", () => {
  it("rend cliquables les sites et les comptes Instagram", () => {
    const h = descriptionEnHtml(
      "Retrouve-la sur umikan.fr, sur Instagram (@umikan.zest) et https://taste-of-mekong.com/.",
    );
    expect(h).toContain('<a href="https://umikan.fr" target="_blank" rel="noopener noreferrer">umikan.fr</a>,');
    expect(h).toContain('href="https://www.instagram.com/umikan.zest/"');
    expect(h).toContain('>@umikan.zest</a>)');
    expect(h).toContain('href="https://taste-of-mekong.com/"');
    expect(h).not.toContain('href="https://taste-of-mekong.com/."');
  });
  it("garde les tirets d'un domaine et les URL avec paramètres", () => {
    const h = descriptionEnHtml("entre-maman-et-moi.fr https://www.instagram.com/tasteofmekong/?hl=fr");
    expect(h).toContain('href="https://entre-maman-et-moi.fr"');
    expect(h).toContain('href="https://www.instagram.com/tasteofmekong/?hl=fr"');
  });
  it("échappe le HTML, découpe les paragraphes, ignore les mails", () => {
    const h = descriptionEnHtml("a <b>\nb\n\nc contact@umikan.fr");
    expect(h).toBe("<p>a &lt;b&gt;<br />b</p><p>c contact@umikan.fr</p>");
  });
  it("laisse le HTML existant tel quel", () => {
    expect(descriptionEnHtml("<p>x</p>")).toBe("<p>x</p>");
    expect(descriptionEnHtml("")).toBe("");
  });
});
