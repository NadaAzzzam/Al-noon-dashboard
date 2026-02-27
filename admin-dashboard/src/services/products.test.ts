import { describe, it, expect } from "vitest";
import {
  getProductDefaultImageUrl,
  getStockForColorSize,
  isAvailabilityEstimated,
  type Product,
} from "./api";

describe("product helpers", () => {
  describe("getProductDefaultImageUrl", () => {
    it("returns media.default.url when present", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
        media: { default: { type: "image", url: "/img/default.jpg" } },
      } as unknown as Product;
      expect(getProductDefaultImageUrl(product)).toBe("/img/default.jpg");
    });

    it("falls back to images[0] when no media", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
        images: ["/img/1.jpg", "/img/2.jpg"],
      } as unknown as Product;
      expect(getProductDefaultImageUrl(product)).toBe("/img/1.jpg");
    });

    it("returns empty string when no images", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
      } as unknown as Product;
      expect(getProductDefaultImageUrl(product)).toBe("");
    });
  });

  describe("getStockForColorSize", () => {
    it("returns stock for matching variant", () => {
      const product = {
        _id: "1",
        name: { en: "Shirt", ar: "قميص" },
        availability: {
          variants: [
            { color: "Red", size: "M", stock: 5, outOfStock: false },
            { color: "Blue", size: "M", stock: 0, outOfStock: true },
          ],
        },
      } as unknown as Product;
      expect(getStockForColorSize(product, "Red", "M")).toBe(5);
    });

    it("returns 0 for out-of-stock variant", () => {
      const product = {
        _id: "1",
        name: { en: "Shirt", ar: "قميص" },
        availability: {
          variants: [
            { color: "Blue", size: "M", stock: 0, outOfStock: true },
          ],
        },
      } as unknown as Product;
      expect(getStockForColorSize(product, "Blue", "M")).toBe(0);
    });

    it("returns 0 when variant not found", () => {
      const product = {
        _id: "1",
        name: { en: "Shirt", ar: "قميص" },
        availability: {
          variants: [{ color: "Red", size: "M", stock: 5, outOfStock: false }],
        },
      } as unknown as Product;
      expect(getStockForColorSize(product, "Green", "L")).toBe(0);
    });

    it("handles empty variants", () => {
      const product = {
        _id: "1",
        name: { en: "Shirt", ar: "قميص" },
        availability: { variants: [] },
      } as unknown as Product;
      expect(getStockForColorSize(product, "Red", "M")).toBe(0);
    });

    it("is case-insensitive", () => {
      const product = {
        _id: "1",
        name: { en: "Shirt", ar: "قميص" },
        availability: {
          variants: [{ color: "Red", size: "M", stock: 3, outOfStock: false }],
        },
      } as unknown as Product;
      expect(getStockForColorSize(product, "red", "m")).toBe(3);
    });
  });

  describe("isAvailabilityEstimated", () => {
    it("returns true when variantsSource is estimated", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
        availability: { variantsSource: "estimated", variants: [] },
      } as unknown as Product;
      expect(isAvailabilityEstimated(product)).toBe(true);
    });

    it("returns false when variantsSource is exact", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
        availability: { variantsSource: "exact", variants: [] },
      } as unknown as Product;
      expect(isAvailabilityEstimated(product)).toBe(false);
    });

    it("returns false when no availability", () => {
      const product = {
        _id: "1",
        name: { en: "Test", ar: "تجربة" },
      } as unknown as Product;
      expect(isAvailabilityEstimated(product)).toBe(false);
    });
  });
});
