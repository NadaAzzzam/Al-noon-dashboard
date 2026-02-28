import { describe, it, expect } from "vitest";
import { buildResponse } from "./chatResponses.js";
import type { ChatResponseData } from "./chatResponses.js";

const minimalData: ChatResponseData = {
  storeName: { en: "Store", ar: "المتجر" },
  contentPages: [],
  paymentMethods: { cod: true, instaPay: false },
  instaPayNumber: "",
  socialLinks: {},
  cities: [],
  categories: []
};

describe("buildResponse (chatResponses)", () => {
  it("escapes user-controlled keywords in product_search to prevent XSS", () => {
    const result = buildResponse(
      "product_search",
      minimalData,
      "en",
      { productKeywords: ['<script>alert("xss")</script>', "normal"] }
    );
    expect(result).not.toMatch(/<script\s*>/i);
    expect(result).toContain("&lt;script&gt;");
    expect(result).toContain("normal");
  });

  it("escapes greeting storeName when interpolated (defense in depth)", () => {
    const dataWithBadStore: ChatResponseData = {
      ...minimalData,
      storeName: { en: "<img src=x onerror=alert(1)>", ar: "المتجر" }
    };
    const result = buildResponse("greeting", dataWithBadStore, "en");
    expect(result).not.toMatch(/<img\s/i);
    expect(result).toContain("&lt;img");
  });

  it("returns valid HTML structure for allowed tags only", () => {
    const result = buildResponse("greeting", minimalData, "en");
    expect(result).toMatch(/<p>/);
    expect(result).not.toMatch(/<script/i);
  });
});
