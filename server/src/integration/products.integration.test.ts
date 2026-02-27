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
});
