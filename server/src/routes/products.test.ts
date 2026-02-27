import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Products API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/products/filters/sort", () => {
    it("returns sort filter options", async () => {
      const res = await request(app).get("/api/products/filters/sort");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty("value");
      expect(res.body.data[0]).toHaveProperty("labelEn");
      expect(res.body.data[0]).toHaveProperty("labelAr");
    });
  });

  describe("GET /api/products", () => {
    it("returns product list with pagination (no auth required)", async () => {
      const res = await request(app).get("/api/products?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("data");
      expect(res.body).toHaveProperty("pagination");
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("accepts search param", async () => {
      const res = await request(app).get("/api/products?search=test");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("accepts status filter", async () => {
      const res = await request(app).get("/api/products?status=ACTIVE");
      expect(res.status).toBe(200);
    });

    it("accepts availability filter", async () => {
      const res = await request(app).get("/api/products?availability=inStock");
      expect(res.status).toBe(200);
    });

    it("accepts sort param", async () => {
      const res = await request(app).get("/api/products?sort=priceAsc");
      expect(res.status).toBe(200);
    });

    it("rejects invalid status", async () => {
      const res = await request(app).get("/api/products?status=INVALID");
      expect(res.status).toBe(400);
    });

    it("rejects limit > 100", async () => {
      const res = await request(app).get("/api/products?limit=101");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/products/:id", () => {
    it("returns 404 for non-existent product", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/api/products/${fakeId}`);
      expect([404, 503]).toContain(res.status);
    });

    it("returns 400 for invalid id format", async () => {
      const res = await request(app).get("/api/products/invalid-id");
      expect(res.status).toBe(400);
    });
  });
});
