import { describe, it, expect } from "vitest";
import {
  productSchema,
  productParamsSchema,
  productQuerySchema,
  productStatusSchema,
} from "./products.js";

const validBody = {
  nameEn: "Test Product",
  nameAr: "منتج تجريبي",
  price: 99.99,
  stock: 10,
  category: "507f1f77bcf86cd799439011",
};

describe("products validators", () => {
  describe("productSchema", () => {
    // === Required fields ===
    it("accepts valid product data", () => {
      expect(productSchema.safeParse({ body: validBody }).success).toBe(true);
    });

    it("rejects missing nameEn", () => {
      expect(productSchema.safeParse({ body: { ...validBody, nameEn: "" } }).success).toBe(false);
    });

    it("rejects missing nameAr", () => {
      expect(productSchema.safeParse({ body: { ...validBody, nameAr: "" } }).success).toBe(false);
    });

    it("rejects non-positive price", () => {
      expect(productSchema.safeParse({ body: { ...validBody, price: 0 } }).success).toBe(false);
    });

    it("rejects negative stock", () => {
      expect(productSchema.safeParse({ body: { ...validBody, stock: -1 } }).success).toBe(false);
    });

    it("rejects non-integer stock", () => {
      expect(productSchema.safeParse({ body: { ...validBody, stock: 10.5 } }).success).toBe(false);
    });

    it("rejects empty category", () => {
      expect(productSchema.safeParse({ body: { ...validBody, category: "" } }).success).toBe(false);
    });

    // === Optional fields - validation rules ===
    it("rejects invalid status", () => {
      expect(productSchema.safeParse({ body: { ...validBody, status: "INVALID" } }).success).toBe(false);
    });

    it("accepts status ACTIVE | INACTIVE | DRAFT", () => {
      for (const status of ["ACTIVE", "INACTIVE", "DRAFT"]) {
        expect(productSchema.safeParse({ body: { ...validBody, status } }).success).toBe(true);
      }
    });

    it("rejects discountPrice zero or negative when provided", () => {
      expect(productSchema.safeParse({ body: { ...validBody, discountPrice: 0 } }).success).toBe(false);
      expect(productSchema.safeParse({ body: { ...validBody, discountPrice: -1 } }).success).toBe(false);
    });

    it("accepts discountPrice when positive and less than price", () => {
      expect(productSchema.safeParse({ body: { ...validBody, discountPrice: 79.99 } }).success).toBe(true);
    });

    it("rejects discountPrice >= price", () => {
      expect(productSchema.safeParse({ body: { ...validBody, discountPrice: 99.99 } }).success).toBe(false);
      expect(productSchema.safeParse({ body: { ...validBody, discountPrice: 150 } }).success).toBe(false);
    });

    it("rejects costPerItem zero or negative when provided", () => {
      expect(productSchema.safeParse({ body: { ...validBody, costPerItem: 0 } }).success).toBe(false);
      expect(productSchema.safeParse({ body: { ...validBody, costPerItem: -1 } }).success).toBe(false);
    });

    it("accepts costPerItem when positive", () => {
      expect(productSchema.safeParse({ body: { ...validBody, costPerItem: 50 } }).success).toBe(true);
    });

    it("rejects invalid slug format", () => {
      expect(productSchema.safeParse({ body: { ...validBody, slug: "Invalid Slug!" } }).success).toBe(false);
      expect(productSchema.safeParse({ body: { ...validBody, slug: "UPPERCASE" } }).success).toBe(false);
    });

    it("accepts valid slug", () => {
      expect(productSchema.safeParse({ body: { ...validBody, slug: "test-product-123" } }).success).toBe(true);
    });

    it("accepts optional media fields", () => {
      expect(productSchema.safeParse({
        body: {
          ...validBody,
          images: ["/uploads/img1.jpg"],
          viewImage: "/view.jpg",
          hoverImage: "/hover.jpg",
          imageColors: ["Red"],
          videos: ["/video.mp4"],
          defaultMediaType: "image",
          hoverMediaType: "video",
        },
      }).success).toBe(true);
    });

    it("rejects invalid defaultMediaType and hoverMediaType", () => {
      expect(productSchema.safeParse({ body: { ...validBody, defaultMediaType: "audio" } }).success).toBe(false);
      expect(productSchema.safeParse({ body: { ...validBody, hoverMediaType: "invalid" } }).success).toBe(false);
    });

    it("accepts optional localized and SEO fields", () => {
      expect(productSchema.safeParse({
        body: {
          ...validBody,
          descriptionEn: "Desc",
          detailsEn: "Details",
          stylingTipEn: "Tip",
          metaTitleEn: "Title",
          metaDescriptionEn: "Meta",
          tags: ["tag1"],
          vendor: "Brand",
          sizes: ["S", "M"],
          sizeDescriptions: ["Small", "Medium"],
          colors: ["Red"],
        },
      }).success).toBe(true);
    });

    it("accepts weight and weightUnit", () => {
      expect(productSchema.safeParse({
        body: { ...validBody, weight: 500, weightUnit: "g" },
      }).success).toBe(true);
    });

    it("rejects invalid weightUnit", () => {
      expect(productSchema.safeParse({
        body: { ...validBody, weight: 1, weightUnit: "lb" },
      }).success).toBe(false);
    });
  });

  describe("productParamsSchema", () => {
    it("accepts valid id", () => {
      expect(productParamsSchema.safeParse({ params: { id: "507f1f77bcf86cd799439011" } }).success).toBe(true);
    });

    it("rejects empty id", () => {
      expect(productParamsSchema.safeParse({ params: { id: "" } }).success).toBe(false);
    });
  });

  describe("productQuerySchema", () => {
    it("accepts empty query with defaults", () => {
      const result = productQuerySchema.safeParse({ query: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(1);
        expect(result.data.query.limit).toBe(20);
      }
    });

    it("accepts all filter fields", () => {
      const result = productQuerySchema.safeParse({
        query: {
          page: 2,
          limit: 50,
          search: "shirt",
          status: "ACTIVE",
          category: "cat123",
          newArrival: "true",
          availability: "inStock",
          color: "Red",
          minPrice: 10,
          maxPrice: 100,
          sort: "priceAsc",
          minRating: 4,
          tags: "summer,best",
          vendor: "Nike",
          hasDiscount: "true",
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts availability outOfStock and all", () => {
      expect(productQuerySchema.safeParse({ query: { availability: "outOfStock" } }).success).toBe(true);
      expect(productQuerySchema.safeParse({ query: { availability: "all" } }).success).toBe(true);
    });

    it("accepts newArrival false and hasDiscount false", () => {
      expect(productQuerySchema.safeParse({ query: { newArrival: "false" } }).success).toBe(true);
      expect(productQuerySchema.safeParse({ query: { hasDiscount: "false" } }).success).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(productQuerySchema.safeParse({ query: { status: "INVALID" } }).success).toBe(false);
    });

    it("rejects invalid availability", () => {
      expect(productQuerySchema.safeParse({ query: { availability: "maybe" } }).success).toBe(false);
    });

    it("rejects limit > 100", () => {
      expect(productQuerySchema.safeParse({ query: { limit: 101 } }).success).toBe(false);
    });

    it("accepts limit 100", () => {
      expect(productQuerySchema.safeParse({ query: { limit: 100 } }).success).toBe(true);
    });

    it("rejects minRating > 5", () => {
      expect(productQuerySchema.safeParse({ query: { minRating: 6 } }).success).toBe(false);
    });

    it("rejects minRating < 1", () => {
      expect(productQuerySchema.safeParse({ query: { minRating: 0 } }).success).toBe(false);
    });

    it("rejects negative minPrice", () => {
      expect(productQuerySchema.safeParse({ query: { minPrice: -1 } }).success).toBe(false);
    });
  });

  describe("productStatusSchema", () => {
    it("accepts valid status update", () => {
      for (const status of ["ACTIVE", "INACTIVE", "DRAFT"]) {
        expect(productStatusSchema.safeParse({
          params: { id: "507f1f77bcf86cd799439011" },
          body: { status },
        }).success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      expect(productStatusSchema.safeParse({
        params: { id: "507f1f77bcf86cd799439011" },
        body: { status: "DELETED" },
      }).success).toBe(false);
    });
  });
});
