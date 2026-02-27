import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";

describe("Orders API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;
  let productId: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
    let cat = await Category.findOne();
    if (!cat) cat = await Category.create({ name: { en: "Test", ar: "تجربة" }, status: "visible" });
    const product = await Product.findOne() ?? await Product.create({
      name: { en: "Order Test Product", ar: "منتج" },
      price: 50,
      stock: 100,
      category: cat._id,
      status: "ACTIVE",
    });
    productId = product._id.toString();
  });

  it("POST /api/orders creates guest order", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: productId, quantity: 2, price: 50 }],
        guestName: "Guest Buyer",
        guestEmail: "guest@test.com",
        shippingAddress: { address: "123 St", city: "Cairo" },
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.order?._id).toBeDefined();
  });

  it("GET /api/orders returns list (auth required)", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("PATCH /api/orders/:id/status updates status and decrements stock", async () => {
    const order = await Order.findOne({ status: "PENDING" });
    if (!order) return;
    const productBefore = await Product.findById(productId);
    const res = await request(app)
      .patch(`/api/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);
    const productAfter = await Product.findById(productId);
    const qty = order.items.find((i) => i.product.toString() === productId)?.quantity ?? 0;
    expect(productAfter!.stock).toBe((productBefore!.stock ?? 0) - qty);
  });
});
