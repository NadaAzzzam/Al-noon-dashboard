import { describe, it, expect } from "vitest";
import i18n, { setStoredLanguage, getStoredLanguage } from "./i18n";

describe("i18n", () => {
  describe("getStoredLanguage", () => {
    it("returns en when language is en", async () => {
      await i18n.changeLanguage("en");
      expect(getStoredLanguage()).toBe("en");
    });

    it("returns ar when language is ar", async () => {
      await i18n.changeLanguage("ar");
      expect(getStoredLanguage()).toBe("ar");
    });

    it("returns en for unknown language code", async () => {
      await i18n.changeLanguage("fr");
      expect(getStoredLanguage()).toBe("en");
    });
  });

  describe("setStoredLanguage", () => {
    it("stores language in localStorage and changes i18n", async () => {
      setStoredLanguage("ar");
      expect(localStorage.getItem("al_noon_lang")).toBe("ar");
      expect(getStoredLanguage()).toBe("ar");

      setStoredLanguage("en");
      expect(localStorage.getItem("al_noon_lang")).toBe("en");
      expect(getStoredLanguage()).toBe("en");
    });
  });
});
