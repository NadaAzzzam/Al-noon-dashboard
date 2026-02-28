import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import mongoose from "mongoose";

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
    const res = await request(app).get("/api/products?page=1&limit=5");
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
    it("GET /api/products?for=storefront returns slim products (omits unused fields)", async () => {
      const res = await request(app).get("/api/products?page=1&limit=5&for=storefront");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = res.body.data[0];
        expect(p).not.toHaveProperty("tags");
        expect(p).not.toHaveProperty("vendor");
        expect(p).not.toHaveProperty("imageColors");
        expect(p).not.toHaveProperty("defaultMediaType");
        expect(p).not.toHaveProperty("hoverMediaType");
        expect(p).not.toHaveProperty("weightUnit");
        expect(p).not.toHaveProperty("sizeDescriptions");
        expect(p).not.toHaveProperty("variants");
        expect(p).not.toHaveProperty("__v");
        expect(p).not.toHaveProperty("createdAt");
        expect(p).not.toHaveProperty("updatedAt");
        expect(p).not.toHaveProperty("isNewArrival");
        expect(p).toHaveProperty("_id");
        expect(p).toHaveProperty("name");
        expect(p).toHaveProperty("media");
        if (p.category && typeof p.category === "object") {
          expect(p.category).not.toHaveProperty("name");
          expect(p.category).not.toHaveProperty("status");
        }
      }
    });

    it("GET /api/products/:id?for=storefront returns slim product with slim availability", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}?for=storefront`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const p = res.body.data?.product;
      expect(p).toBeDefined();
      expect(p).not.toHaveProperty("tags");
      expect(p).not.toHaveProperty("vendor");
      expect(p).not.toHaveProperty("imageColors");
      expect(p).not.toHaveProperty("defaultMediaType");
      expect(p).not.toHaveProperty("hoverMediaType");
      expect(p).not.toHaveProperty("variants");
      expect(p).not.toHaveProperty("__v");
      expect(p).not.toHaveProperty("createdAt");
      expect(p).not.toHaveProperty("updatedAt");
      expect(p).not.toHaveProperty("isNewArrival");
      expect(p).toHaveProperty("availability");
      if (p.availability?.colors?.length > 0) {
        const c = p.availability.colors[0];
        expect(c).not.toHaveProperty("imageUrl");
        expect(c).not.toHaveProperty("hasImage");
        expect(c).not.toHaveProperty("availableSizeCount");
        expect(c).toHaveProperty("color");
        expect(c).toHaveProperty("outOfStock");
      }
      expect(p.availability).not.toHaveProperty("variantsSource");
      expect(p.availability).not.toHaveProperty("availableSizeCount");
      if (p.category && typeof p.category === "object") {
        expect(p.category).not.toHaveProperty("name");
        expect(p.category).not.toHaveProperty("status");
      }
    });

    it("GET /api/products/:id without for=storefront returns full product", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}`);
      expect(res.status).toBe(200);
      const p = res.body.data?.product;
      expect(p).toHaveProperty("__v");
      expect(p).toHaveProperty("createdAt");
      expect(p).toHaveProperty("updatedAt");
      if (p.availability?.colors?.length > 0) {
        expect(p.availability.colors[0]).toHaveProperty("hasImage");
      }
    });

    it("GET /api/products/:id/related?for=storefront returns slim related products", async () => {
      const product = await Product.findOne({ "name.en": "Integration Test Product" });
      expect(product).toBeTruthy();
      const res = await request(app).get(`/api/products/${product!._id}/related?for=storefront&limit=4`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = res.body.data[0];
        expect(p).not.toHaveProperty("tags");
        expect(p).not.toHaveProperty("__v");
        expect(p).not.toHaveProperty("createdAt");
        expect(p).not.toHaveProperty("updatedAt");
      }
    });
  });
});
