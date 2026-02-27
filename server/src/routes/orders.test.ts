import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

describe("Orders API", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  describe("POST /api/orders (guest checkout)", () => {
    const validGuestOrder = {
      items: [
        { product: "507f1f77bcf86cd799439011", quantity: 1, price: 50 },
      ],
      guestName: "Guest Buyer",
      guestEmail: "guest@example.com",
      shippingAddress: { address: "456 Oak Ave", city: "Alexandria" },
    };

    it("validates required guest fields", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          items: validGuestOrder.items,
          guestName: "",
          guestEmail: "valid@email.com",
        });
      expect(res.status).toBe(400);
    });

    it("validates guest email format", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validGuestOrder,
          guestEmail: "invalid",
        });
      expect(res.status).toBe(400);
    });

    it("validates items array not empty", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          guestName: "Guest",
          guestEmail: "g@test.com",
          items: [],
        });
      expect(res.status).toBe(400);
    });

    it("validates item quantity positive", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validGuestOrder,
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 0, price: 50 }],
        });
      expect(res.status).toBe(400);
    });

    it("validates item price positive", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validGuestOrder,
          items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: -10 }],
        });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/orders", () => {
    it("requires authentication", async () => {
      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("requires authentication", async () => {
      const res = await request(app).get("/api/orders/507f1f77bcf86cd799439011");
      expect(res.status).toBe(401);
    });
  });
});
