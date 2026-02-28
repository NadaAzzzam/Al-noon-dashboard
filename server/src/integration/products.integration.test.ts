import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import mongoose from "mongoose";

/** API product shape (list/detail). Use for type-safe assertions on response bodies. */
type ApiProduct = Record<string, unknown>;

function asProduct(val: unknown): ApiProduct {
  if (val && typeof val === "object") return val as ApiProduct;
  return {};
}

/** Assert object does not have property (type-safe for unknown). */
function expectNotToHaveProperty(obj: ApiProduct, key: string): void {
  expect(key in obj).toBe(false);
}

/** Assert object has property (type-safe for unknown). */
function expectToHaveProperty(obj: ApiProduct, key: string): void {
  expect(key in obj).toBe(true);
}

describe("Products API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;
  let categoryId: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
    const cat = await Category.findOne();
    categoryId = cat?._id?.toString() ?? (await Category.create({ name: { en: "Test", ar: "تجربة" }, status: "visible" }))._id.toString();
  });

  it("GET /api/products returns list with pagination", async () => {
    const res = await request(app).get("/api/products?slug=*&page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  it("POST /api/products creates product (auth required)", async () => {
    const payload = {
      nameEn: "Integration Test Product",
      nameAr: "منتج اختبار",
      price: 99.99,
      stock: 10,
      category: categoryId,
      discountPrice: 79.99,
    };
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.product).toBeDefined();
    expect(res.body.data.product.name?.en).toBe("Integration Test Product");
  });

  it("GET /api/products/:id returns created product", async () => {
    const product = await Product.findOne({ "name.en": "Integration Test Product" });
    expect(product).toBeTruthy();
    const res = await request(app).get(`/api/products/${product!._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.product?.name?.en).toBe("Integration Test Product");
  });

  it("GET /api/products?slug=<slug> filters by slug.en or slug.ar", async () => {
    const product = await Product.findOne({ "name.en": "Integration Test Product" });
    expect(product).toBeTruthy();
    const slugEn = typeof product!.slug === "object" ? product!.slug.en : product!.slug;
    expect(slugEn).toBeTruthy();
    const res = await request(app).get(`/api/products?slug=${encodeURIComponent(slugEn)}&page=1&limit=5`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.find((p: { _id?: string }) => String(p._id) === String(product!._id));
    expect(found).toBeDefined();
  });

  it("GET /api/products/:id returns discountPercent when product has discount", async () => {
    const product = await Product.findOne({ "name.en": "Integration Test Product" });
    expect(product).toBeTruthy();
    const res = await request(app).get(`/api/products/${product!._id}`);
    expect(res.status).toBe(200);
    const raw = res.body.data?.product;
    expect(raw).toBeDefined();
    const p = asProduct(raw);
    expect(p.price).toBe(99.99);
    expect(p.discountPrice).toBe(79.99);
    expect(p.discountPercent).toBe(20); // 20% off
  });

  describe("GET /api/products/:id with color and size query params", () => {
    it("returns selectedVariant when both color and size match a variant", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const productId = product!._id.toString();
      await Product.findByIdAndUpdate(productId, {
        colors: ["Black", "Navy"],
        sizes: ["S", "M", "L"],
        variants: [
          { color: "Black", size: "M", stock: 5, outOfStock: false },
          { color: "Black", size: "L", stock: 0, outOfStock: true },
          { color: "Navy", size: "M", stock: 3, outOfStock: false },
        ],
      });
      const res = await request(app).get(`/api/products/${productId}`).query({ color: "Black", size: "M" });
      expect(res.status).toBe(200);
      const raw = res.body.data?.product;
      expect(raw).toBeDefined();
      const p = asProduct(raw);
      expectToHaveProperty(p, "selectedVariant");
      const sv = p.selectedVariant as { color: string; size: string; stock: number; outOfStock: boolean };
      expect(sv.color).toBe("Black");
      expect(sv.size).toBe("M");
      expect(sv.stock).toBe(5);
      expect(sv.outOfStock).toBe(false);
    });

    it("omits selectedVariant when color+size do not match any variant", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const productId = product!._id.toString();
      const res = await request(app).get(`/api/products/${productId}`).query({ color: "Unknown", size: "XL" });
      expect(res.status).toBe(200);
      const raw = res.body.data?.product;
      expect(raw).toBeDefined();
      const p = asProduct(raw);
      expectNotToHaveProperty(p, "selectedVariant");
    });

    it("omits selectedVariant when only color is provided (no size)", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const productId = product!._id.toString();
      const res = await request(app).get(`/api/products/${productId}`).query({ color: "Black" });
      expect(res.status).toBe(200);
      const raw = res.body.data?.product;
      expect(raw).toBeDefined();
      const p = asProduct(raw);
      expectNotToHaveProperty(p, "selectedVariant");
    });
  });

  it("POST /api/products with slugEn/slugAr creates product with custom slugs", async () => {
    const payload = {
      nameEn: "Slug Test Product",
      nameAr: "منتج تجريبي",
      price: 49.99,
      stock: 5,
      category: categoryId,
      slugEn: "custom-slug-test",
      slugAr: "منتج-تجريبي-مخصص",
    };
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const saved = await Product.findOne({ "name.en": "Slug Test Product" });
    expect(saved).toBeTruthy();
    expect(saved!.slug).toBeDefined();
    expect(typeof saved!.slug).toBe("object");
    expect((saved!.slug as { en?: string }).en).toBe("custom-slug-test");
    expect((saved!.slug as { ar?: string }).ar).toBe("منتج-تجريبي-مخصص");
  });

  it("rejects discountPrice >= price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        nameEn: "Bad",
        nameAr: "سيء",
        price: 50,
        discountPrice: 100,
        stock: 5,
        category: categoryId,
      });
    expect(res.status).toBe(400);
  });

  describe("for=storefront (slim response)", () => {
    it("GET /api/products?for=storefront returns slim products (omits unused fields, no discountPrice)", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      const slug = (typeof product?.slug === "object" ? product?.slug?.en : product?.slug) ?? "integration-test-product";
      const res = await request(app).get(`/api/products?slug=${encodeURIComponent(slug)}&page=1&limit=5&for=storefront`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = asProduct(res.body.data[0]);
        expectToHaveProperty(p, "tags"); // storefront includes tags for clickable filter links
        expectNotToHaveProperty(p, "vendor");
        expectNotToHaveProperty(p, "imageColors");
        expectNotToHaveProperty(p, "defaultMediaType");
        expectNotToHaveProperty(p, "hoverMediaType");
        expectNotToHaveProperty(p, "weightUnit");
        expectNotToHaveProperty(p, "sizeDescriptions");
        expectNotToHaveProperty(p, "variants");
        expectNotToHaveProperty(p, "__v");
        expectNotToHaveProperty(p, "createdAt");
        expectNotToHaveProperty(p, "updatedAt");
        expectNotToHaveProperty(p, "isNewArrival");
        expectNotToHaveProperty(p, "discountPrice");
        expectToHaveProperty(p, "_id");
        expectToHaveProperty(p, "name");
        expectToHaveProperty(p, "media");
        const cat = p.category;
        if (cat && typeof cat === "object") {
          expectNotToHaveProperty(asProduct(cat), "name");
          expectNotToHaveProperty(asProduct(cat), "status");
        }
      }
    });

    it("GET /api/products/:id?for=storefront returns slim product with slim availability", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}?for=storefront`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const raw = res.body.data?.product;
      expect(raw).toBeDefined();
      const p = asProduct(raw);
      expectToHaveProperty(p, "tags"); // storefront includes tags for clickable filter links
      expectNotToHaveProperty(p, "vendor");
      expectNotToHaveProperty(p, "imageColors");
      expectNotToHaveProperty(p, "defaultMediaType");
      expectNotToHaveProperty(p, "hoverMediaType");
      expectNotToHaveProperty(p, "variants");
      expectNotToHaveProperty(p, "__v");
      expectNotToHaveProperty(p, "createdAt");
      expectNotToHaveProperty(p, "updatedAt");
      expectNotToHaveProperty(p, "isNewArrival");
      expectNotToHaveProperty(p, "discountPrice");
      expectToHaveProperty(p, "availability");
      expect(p.discountPercent).toBe(20);
      const avail = p.availability as { colors?: ApiProduct[] } | undefined;
      if (avail?.colors && avail.colors.length > 0) {
        const c = asProduct(avail.colors[0]);
        expectNotToHaveProperty(c, "imageUrl");
        expectNotToHaveProperty(c, "hasImage");
        expectNotToHaveProperty(c, "availableSizeCount");
        expectToHaveProperty(c, "color");
        expectToHaveProperty(c, "outOfStock");
      }
      if (avail) expectNotToHaveProperty(avail as ApiProduct, "variantsSource");
      if (avail) expectNotToHaveProperty(avail as ApiProduct, "availableSizeCount");
      const cat = p.category;
      if (cat && typeof cat === "object") {
        expectNotToHaveProperty(asProduct(cat), "name");
        expectNotToHaveProperty(asProduct(cat), "status");
      }
    });

    it("GET /api/products/:id without for=storefront returns full product", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}`);
      expect(res.status).toBe(200);
      const raw = res.body.data?.product;
      expect(raw).toBeDefined();
      const p = asProduct(raw);
      expectToHaveProperty(p, "__v");
      expectToHaveProperty(p, "createdAt");
      expectToHaveProperty(p, "updatedAt");
      const av = p.availability as { colors?: { hasImage?: unknown }[] } | undefined;
      if (av?.colors && av.colors.length > 0) {
        expectToHaveProperty(asProduct(av.colors[0]), "hasImage");
      }
    });

    it("GET /api/products/:id/related?for=storefront returns slim related products", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}/related?for=storefront&limit=4`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = asProduct(res.body.data[0]);
        expectToHaveProperty(p, "tags"); // storefront includes tags for clickable filter links
        expectNotToHaveProperty(p, "__v");
        expectNotToHaveProperty(p, "createdAt");
        expectNotToHaveProperty(p, "updatedAt");
      }
    });
  });
});
