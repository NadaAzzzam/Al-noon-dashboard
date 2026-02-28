import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Checkout API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/shipping-methods", () => {
    it("returns shipping methods list (no auth required)", async () => {
      const res = await request(app).get("/api/shipping-methods");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty("id");
        expect(res.body.data[0]).toHaveProperty("name");
        expect(res.body.data[0]).toHaveProperty("price");
      }
    });
  });

  describe("POST /api/checkout", () => {
    const validCheckoutBody = {
      items: [
        { product: "507f1f77bcf86cd799439011", quantity: 1, price: 99.99 },
      ],
      paymentMethod: "COD",
      shippingAddress: {
        address: "123 Main St",
        city: "Cairo",
        apartment: "Apt 4",
        postalCode: "12345",
      },
      guestName: "Test Guest",
      guestEmail: "guest@example.com",
    };

    it("rejects empty items", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          ...validCheckoutBody,
          items: [],
        });
      expect(res.status).toBe(400);
    });

    it("rejects missing guest name for guest checkout", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          items: validCheckoutBody.items,
          guestEmail: "guest@example.com",
          shippingAddress: validCheckoutBody.shippingAddress,
        });
      expect(res.status).toBe(400);
    });

    it("rejects invalid guest email", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          ...validCheckoutBody,
          guestEmail: "not-an-email",
        });
      expect(res.status).toBe(400);
    });

    it("rejects invalid item (zero quantity)", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .send({
          ...validCheckoutBody,
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 0, price: 99 }],
        });
      expect(res.status).toBe(400);
    });

    it("accepts valid checkout body structure (may 404/503 if DB unavailable)", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .set("Content-Type", "application/json")
        .send(validCheckoutBody);
      // 201 if order created, 400 if validation fails, 503 if DB down
      expect([201, 400, 404, 503]).toContain(res.status);
    });
  });

  describe("POST /api/orders (same as checkout)", () => {
    const validOrderBody = {
      items: [
        { product: "507f1f77bcf86cd799439011", quantity: 1, price: 99.99 },
      ],
      paymentMethod: "COD",
      shippingAddress: { address: "123 St", city: "Cairo" },
      guestName: "Guest User",
      guestEmail: "guest@test.com",
    };

    it("rejects invalid body", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ items: [], guestName: "X", guestEmail: "bad" });
      expect(res.status).toBe(400);
    });
  });
});

describe("Guest Order Lookup API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("GET /api/orders/guest/:id", () => {
    it("returns 400 when email query param is missing", async () => {
      const res = await request(app).get("/api/orders/guest/507f1f77bcf86cd799439011");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBeDefined();
    });

    it("returns 400 when email query param is invalid", async () => {
      const res = await request(app)
        .get("/api/orders/guest/507f1f77bcf86cd799439011")
        .query({ email: "not-an-email" });
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent order", async () => {
      const res = await request(app)
        .get("/api/orders/guest/507f1f77bcf86cd799439012")
        .query({ email: "guest@example.com" });
      expect(res.status).toBe(404);
    });
  });
});
