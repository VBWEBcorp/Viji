import { describe, it, expect } from "vitest";
import { typeImage } from "./preparer-image";

describe("typeImage", () => {
  it("ramène les variantes JPEG au vrai type", () => {
    expect(typeImage("photo.jpg", "image/jpg")).toBe("image/jpeg");
    expect(typeImage("photo.jpg", "image/pjpeg")).toBe("image/jpeg");
    expect(typeImage("IMG_1234.JPG", "")).toBe("image/jpeg");
    expect(typeImage("photo.jpeg", "application/octet-stream")).toBe("image/jpeg");
  });
  it("garde un type déjà juste", () => {
    expect(typeImage("a.png", "image/png")).toBe("image/png");
    expect(typeImage("a.heic", "image/heic")).toBe("image/heic");
  });
});
