import { describe, it, expect, beforeAll, afterEach, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Settings } from "../models/Settings.js";
import { DiscountCode } from "../models/DiscountCode.js";

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

  it("POST /api/checkout rejects order when product is out of stock", async () => {
    const outOfStockProduct = await Product.create({
      name: { en: "Out Of Stock", ar: "نفد" },
      price: 99,
      stock: 0,
      variants: [],
      category: (await Category.findOne())!._id,
      status: "ACTIVE",
    });
    const res = await request(app)
      .post("/api/checkout")
      .send({
        items: [{ product: outOfStockProduct._id.toString(), quantity: 1, price: 99 }],
        guestName: "Guest",
        guestEmail: "guest-oo@test.com",
        shippingAddress: { address: "123 St", city: "Cairo" },
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message?.toLowerCase()).toMatch(/out of stock|stock/i);
    await Product.findByIdAndDelete(outOfStockProduct._id);
  });

  it("GET /api/orders/guest/:id?email=xxx returns guest order when email matches", async () => {
    const guestEmail = "guest-lookup@test.com";
    const createRes = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: productId, quantity: 1, price: 50 }],
        guestName: "Guest Lookup",
        guestEmail,
        shippingAddress: { address: "999 Lookup St", city: "Cairo" },
      });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body?.data?.order?._id ?? createRes.body?.data?.order?.id;
    expect(orderId).toBeDefined();

    const getRes = await request(app)
      .get(`/api/orders/guest/${orderId}`)
      .query({ email: guestEmail });
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data?.order).toBeDefined();
    expect(getRes.body.data.order.guestEmail ?? getRes.body.data.order.email).toBe(guestEmail);
  });

  it("GET /api/orders/guest/:id returns 404 when email does not match", async () => {
    const guestEmail = "guest-no-match@test.com";
    const createRes = await request(app)
      .post("/api/orders")
      .send({
        items: [{ product: productId, quantity: 1, price: 50 }],
        guestName: "Guest",
        guestEmail,
        shippingAddress: { address: "123 St", city: "Cairo" },
      });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body?.data?.order?._id ?? createRes.body?.data?.order?.id;

    const getRes = await request(app)
      .get(`/api/orders/guest/${orderId}`)
      .query({ email: "wrong@email.com" });
    expect(getRes.status).toBe(404);
  });

  it("POST /api/orders/:id/payments/confirm approves InstaPay payment and decrements stock", async () => {
    const order = await Order.create({
      items: [{ product: productId, quantity: 3, price: 50 }],
      total: 200,
      status: "PENDING",
      paymentMethod: "INSTAPAY",
      guestName: "InstaPay Guest",
      guestEmail: "instapay-confirm@test.com",
      shippingAddress: { address: "456 InstaPay St", city: "Cairo" },
    });
    await Payment.create({
      order: order._id,
      method: "INSTAPAY",
      status: "UNPAID",
    });
    const orderId = order._id.toString();

    const productBefore = await Product.findById(productId);
    const stockBefore = productBefore!.stock ?? 0;

    const confirmRes = await request(app)
      .post(`/api/orders/${orderId}/payments/confirm`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ approved: true });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data?.payment?.status).toBe("PAID");

    const payment = await Payment.findOne({ order: orderId });
    expect(payment?.status).toBe("PAID");

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder?.status).toBe("CONFIRMED");

    const productAfter = await Product.findById(productId);
    expect(productAfter!.stock).toBe(stockBefore - 3);
  });

  describe("Discount code flow", () => {
    beforeEach(async () => {
      await Settings.findOneAndUpdate(
        {},
        { $set: { "advancedSettings.discountCodeSupported": true } },
        { upsert: true }
      );
      await DiscountCode.findOneAndUpdate(
        { code: "SAVE10" },
        {
          code: "SAVE10",
          type: "PERCENT",
          value: 10,
          minOrderAmount: 0,
          enabled: true,
          usedCount: 0,
        },
        { upsert: true, new: true }
      );
    });
    afterEach(async () => {
      await Settings.findOneAndUpdate(
        {},
        { $set: { "advancedSettings.discountCodeSupported": true } },
        { upsert: true }
      );
    });

    it("POST /api/checkout/apply-discount returns valid discount when code exists", async () => {
      const res = await request(app)
        .post("/api/checkout/apply-discount")
        .set("Content-Type", "application/json")
        .send({ discountCode: "SAVE10", subtotal: 200 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data?.valid).toBe(true);
      expect(res.body.data?.discountCode).toBe("SAVE10");
      expect(res.body.data?.discountAmount).toBe(20);
      expect(res.body.data?.subtotalAfterDiscount).toBe(180);
    });

    it("POST /api/checkout with discountCode applies discount to order", async () => {
      const res = await request(app)
        .post("/api/checkout")
        .set("Content-Type", "application/json")
        .send({
          items: [{ product: productId, quantity: 2, price: 100 }],
          guestName: "Discount Guest",
          guestEmail: "discount-guest@test.com",
          shippingAddress: { address: "123 St", city: "Cairo" },
          discountCode: "SAVE10",
        });
      expect(res.status).toBe(201);
      expect(res.body.data?.order?.discountCode).toBe("SAVE10");
      // Server uses product price (50), so subtotal = 2*50 = 100, 10% = 10
      expect(res.body.data?.order?.discountAmount).toBe(10);
      expect(res.body.data?.order?.total).toBe(90 + (res.body.data?.order?.deliveryFee ?? 65));
    });

    it("POST /api/checkout/apply-discount returns 403 when discountCodeSupported is false", async () => {
      await Settings.findOneAndUpdate(
        {},
        { $set: { "advancedSettings.discountCodeSupported": false } },
        { upsert: true }
      );
      const res = await request(app)
        .post("/api/checkout/apply-discount")
        .set("Content-Type", "application/json")
        .send({ discountCode: "SAVE10", subtotal: 200 });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/checkout returns 403 when discountCode provided but discountCodeSupported is false", async () => {
      await Settings.findOneAndUpdate(
        {},
        { $set: { "advancedSettings.discountCodeSupported": false } },
        { upsert: true }
      );
      const res = await request(app)
        .post("/api/checkout")
        .set("Content-Type", "application/json")
        .send({
          items: [{ product: productId, quantity: 1, price: 100 }],
          guestName: "Guest",
          guestEmail: "no-discount@test.com",
          shippingAddress: { address: "123 St", city: "Cairo" },
          discountCode: "SAVE10",
        });
      expect(res.status).toBe(403);
    });
  });

  it("POST /api/orders/:id/payments/confirm rejects payment when approved is false", async () => {
    const order = await Order.create({
      items: [{ product: productId, quantity: 1, price: 50 }],
      total: 50,
      status: "PENDING",
      paymentMethod: "INSTAPAY",
      guestName: "Reject Guest",
      guestEmail: "instapay-reject@test.com",
      shippingAddress: { address: "789 Reject St", city: "Cairo" },
    });
    await Payment.create({
      order: order._id,
      method: "INSTAPAY",
      status: "UNPAID",
    });
    const orderId = order._id.toString();

    const confirmRes = await request(app)
      .post(`/api/orders/${orderId}/payments/confirm`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ approved: false });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data?.payment?.status).toBe("UNPAID");

    const updatedOrder = await Order.findById(orderId);
    expect(updatedOrder?.status).toBe("PENDING");
  });
});
