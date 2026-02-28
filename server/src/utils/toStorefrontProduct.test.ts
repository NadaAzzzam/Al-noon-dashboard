import { describe, it, expect } from "vitest";
import { toStorefrontProduct } from "./toStorefrontProduct.js";

const OMITTED_KEYS = [
  "tags",
  "vendor",
  "imageColors",
  "defaultMediaType",
  "hoverMediaType",
  "weightUnit",
  "sizeDescriptions",
  "variants",
  "__v",
  "createdAt",
  "updatedAt",
  "isNewArrival",
] as const;

describe("toStorefrontProduct", () => {
  it("omits all unused root fields", () => {
    const full = {
      _id: "123",
      name: { en: "Test", ar: "تجربة" },
      tags: ["a"],
      vendor: "Brand",
      imageColors: ["Black"],
      defaultMediaType: "image",
      hoverMediaType: "image",
      weightUnit: "g",
      sizeDescriptions: [""],
      variants: [{ color: "Black", size: "M", stock: 5 }],
      __v: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      isNewArrival: false,
    };
    const slim = toStorefrontProduct(full);
    for (const key of OMITTED_KEYS) {
      expect(slim).not.toHaveProperty(key);
    }
    expect(slim).toHaveProperty("_id", "123");
    expect(slim).toHaveProperty("name");
  });

  it("preserves all used storefront fields", () => {
    const full = {
      _id: "p1",
      name: { en: "Test", ar: "تجربة" },
      description: { en: "Desc", ar: "وصف" },
      category: { _id: "c1" },
      price: 100,
      discountPrice: 80,
      images: ["/a.jpg"],
      videos: ["/v.mp4"],
      media: { default: { type: "image", url: "/a.jpg" } },
      stock: 10,
      status: "ACTIVE",
      sizes: ["M", "L"],
      colors: ["Black"],
      details: { en: "Details", ar: "تفاصيل" },
      stylingTip: { en: "Tip", ar: "نصيحة" },
      inStock: true,
      formattedDetails: { en: [{ type: "paragraph", text: "Details" }], ar: [] },
      slug: "test-product",
      averageRating: 4.5,
      ratingCount: 12,
    };
    const slim = toStorefrontProduct(full);
    expect(slim._id).toBe("p1");
    expect(slim.name).toEqual({ en: "Test", ar: "تجربة" });
    expect(slim.description).toEqual({ en: "Desc", ar: "وصف" });
    expect(slim.price).toBe(100);
    expect(slim.discountPrice).toBe(80);
    expect(slim.images).toEqual(["/a.jpg"]);
    expect(slim.videos).toEqual(["/v.mp4"]);
    expect(slim.media).toEqual({ default: { type: "image", url: "/a.jpg" } });
    expect(slim.stock).toBe(10);
    expect(slim.status).toBe("ACTIVE");
    expect(slim.sizes).toEqual(["M", "L"]);
    expect(slim.colors).toEqual(["Black"]);
    expect(slim.details).toEqual({ en: "Details", ar: "تفاصيل" });
    expect(slim.stylingTip).toEqual({ en: "Tip", ar: "نصيحة" });
    expect(slim.inStock).toBe(true);
    expect(slim.formattedDetails).toBeDefined();
    expect(slim.slug).toBe("test-product");
    expect(slim.averageRating).toBe(4.5);
    expect(slim.ratingCount).toBe(12);
  });

  it("handles null category", () => {
    const full = { _id: "p1", category: null };
    const slim = toStorefrontProduct(full);
    expect(slim.category).toBeNull();
  });

  it("handles undefined category", () => {
    const full = { _id: "p1" };
    const slim = toStorefrontProduct(full);
    expect(slim).not.toHaveProperty("category");
  });

  it("handles category with id instead of _id", () => {
    const full = { _id: "p1", category: { id: "c1", name: { en: "Cat" } } };
    const slim = toStorefrontProduct(full);
    expect((slim.category as { _id: unknown })._id).toBe("c1");
  });

  it("handles missing availability", () => {
    const full = { _id: "p1", name: { en: "Test", ar: "" } };
    const slim = toStorefrontProduct(full);
    expect(slim).not.toHaveProperty("availability");
  });

  it("handles empty availability.colors", () => {
    const full = {
      _id: "p1",
      availability: { colors: [], sizes: [], variants: [] },
    };
    const slim = toStorefrontProduct(full);
    expect((slim.availability as { colors: unknown[] }).colors).toEqual([]);
  });

  it("handles product with no optional fields", () => {
    const full = { _id: "p1", name: { en: "Min", ar: "" } };
    const slim = toStorefrontProduct(full);
    expect(slim._id).toBe("p1");
    expect(slim.name).toEqual({ en: "Min", ar: "" });
  });

  it("slims category to only _id", () => {
    const full = {
      _id: "p1",
      category: { _id: "c1", name: { en: "Cat", ar: "فئة" }, status: "visible" },
    };
    const slim = toStorefrontProduct(full);
    expect(slim.category).toEqual({ _id: "c1" });
  });

  it("slims availability.colors", () => {
    const full = {
      _id: "p1",
      availability: {
        variantsSource: "exact",
        availableSizeCount: 3,
        colors: [
          { color: "Black", available: true, outOfStock: false, hasImage: true, imageUrl: "/a.jpg", availableSizeCount: 1 },
          { color: "Navy", available: true, outOfStock: false, hasImage: false },
        ],
        sizes: [{ size: "M", available: true, outOfStock: false }],
        variants: [{ color: "Black", size: "M", stock: 5, outOfStock: false }],
      },
    };
    const slim = toStorefrontProduct(full);
    expect(slim.availability).not.toHaveProperty("variantsSource");
    expect(slim.availability).not.toHaveProperty("availableSizeCount");
    expect((slim.availability as { colors: unknown[] }).colors[0]).toEqual({
      color: "Black",
      available: true,
      outOfStock: false,
    });
    expect((slim.availability as { colors: unknown[] }).colors[1]).toEqual({
      color: "Navy",
      available: true,
      outOfStock: false,
    });
    expect((slim.availability as Record<string, unknown>).sizes).toHaveLength(1);
    expect((slim.availability as Record<string, unknown>).variants).toHaveLength(1);
  });
});
