import { describe, it, expect } from "vitest";
import { updateSettingsSchema } from "./settings.js";

describe("settings validators", () => {
  describe("updateSettingsSchema", () => {
    it("accepts empty body (partial update)", () => {
      expect(updateSettingsSchema.safeParse({ body: {} }).success).toBe(true);
    });

    it("accepts comingSoonMode and comingSoonMessage", () => {
      expect(updateSettingsSchema.safeParse({
        body: {
          comingSoonMode: true,
          comingSoonMessageEn: "We'll be back soon!",
          comingSoonMessageAr: "سنعود قريباً!",
        },
      }).success).toBe(true);
    });

    it("accepts underConstructionMode and underConstructionMessage", () => {
      expect(updateSettingsSchema.safeParse({
        body: {
          underConstructionMode: true,
          underConstructionMessageEn: "Site under construction",
          underConstructionMessageAr: "الموقع قيد الإنشاء",
        },
      }).success).toBe(true);
    });

    it("accepts all coming-soon and under-construction fields together", () => {
      expect(updateSettingsSchema.safeParse({
        body: {
          comingSoonMode: false,
          comingSoonMessageEn: "",
          comingSoonMessageAr: "",
          underConstructionMode: true,
          underConstructionMessageEn: "Coming soon",
          underConstructionMessageAr: "قريباً",
        },
      }).success).toBe(true);
    });

    it("rejects comingSoonMessageEn over 500 chars", () => {
      const result = updateSettingsSchema.safeParse({
        body: { comingSoonMessageEn: "x".repeat(501) },
      });
      expect(result.success).toBe(false);
    });

    it("rejects underConstructionMessageAr over 500 chars", () => {
      const result = updateSettingsSchema.safeParse({
        body: { underConstructionMessageAr: "x".repeat(501) },
      });
      expect(result.success).toBe(false);
    });

    it("accepts storeNameEn/Ar and other existing fields", () => {
      expect(updateSettingsSchema.safeParse({
        body: {
          storeNameEn: "Al-noon",
          storeNameAr: "النون",
          newsletterEnabled: true,
          discountCodeSupported: false,
          comingSoonMode: true,
        },
      }).success).toBe(true);
    });
  });
});
