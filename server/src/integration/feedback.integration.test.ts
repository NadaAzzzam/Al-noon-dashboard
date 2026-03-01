import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";

describe("Feedback API (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let authToken: string;
  let productId: string;

  beforeAll(async () => {
    app = createApp();
    const loginRes = await request(app)
      .post("/api/auth/sign-in")
      .send({ email: "admin@localhost", password: "admin123" });
    authToken = loginRes.body?.data?.token ?? loginRes.body?.token ?? "";
    const cat = await Category.findOne() ?? (await Category.create({ name: { en: "Test", ar: "تجربة" }, status: "visible" }));
    const product = await Product.findOne() ?? (await Product.create({
      name: { en: "Feedback Test Product", ar: "منتج" },
      price: 100,
      stock: 10,
      category: cat._id,
      status: "ACTIVE",
    }));
    productId = product._id.toString();
  });

  it("POST /api/feedback creates feedback and persists to DB", async () => {
    const customerName = `Customer ${Date.now()}`;
    const message = "Great product, integration test feedback!";
    const res = await request(app)
      .post("/api/feedback")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        product: productId,
        customerName,
        message,
        rating: 5,
        approved: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.feedback).toBeDefined();

    const saved = await ProductFeedback.findOne({ customerName });
    expect(saved).toBeTruthy();
    expect(saved!.customerName).toBe(customerName);
    expect(saved!.message).toBe(message);
    expect(saved!.rating).toBe(5);
    expect(saved!.approved).toBe(true);
    expect(saved!.product.toString()).toBe(productId);
  });
});
