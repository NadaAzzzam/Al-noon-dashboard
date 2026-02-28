import { describe, it, expect } from "vitest";
import { buildSeoMeta } from "./buildSeoMeta.js";

describe("buildSeoMeta", () => {
  it("builds meta title and description for short text", () => {
    const result = buildSeoMeta(
      { en: "Abaya", ar: "عباية" },
      { en: "Beautiful abaya", ar: "عباية جميلة" }
    );
    expect(result.metaTitle.en).toBe("Abaya | Al-noon");
    expect(result.metaTitle.ar).toContain("عباية");
    expect(result.metaDescription.en).toBe("Beautiful abaya");
    expect(result.metaDescription.ar).toBe("عباية جميلة");
  });

  it("truncates long title", () => {
    const longName = "A".repeat(70);
    const result = buildSeoMeta(
      { en: longName, ar: longName },
      { en: "Short", ar: "قصير" }
    );
    expect(result.metaTitle.en.length).toBe(60);
    expect(result.metaTitle.en.endsWith("...")).toBe(true);
  });

  it("truncates long description", () => {
    const longDesc = "B".repeat(200);
    const result = buildSeoMeta(
      { en: "Product", ar: "منتج" },
      { en: longDesc, ar: longDesc }
    );
    expect(result.metaDescription.en.length).toBe(160);
    expect(result.metaDescription.en.endsWith("...")).toBe(true);
  });

  it("uses fallbacks for empty name/description", () => {
    const result = buildSeoMeta(
      { en: "", ar: "" },
      { en: "", ar: "" }
    );
    expect(result.metaTitle.en).toContain("product");
    expect(result.metaTitle.ar).toContain("منتج");
  });
});
