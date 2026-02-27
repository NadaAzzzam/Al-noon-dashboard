/**
 * Minimal seed for E2E tests: admin user, 1 category, 1 product, 1 order.
 * Run before Cypress: npm run seed:test
 * Requires: server connected to MongoDB (or use same MONGO_URI as running server).
 */
import { connectDatabase } from "../config/db.js";
import { ensureDefaultRoles } from "./ensureDefaultRoles.js";
import { ensureDefaultDepartments } from "./ensureDefaultDepartments.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import mongoose from "mongoose";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@localhost";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

async function seedTestData() {
  await connectDatabase();
  await ensureDefaultRoles();
  await ensureDefaultDepartments();

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.role = "ADMIN";
    if (ADMIN_NAME) existing.name = ADMIN_NAME;
    if (ADMIN_PASSWORD) existing.password = ADMIN_PASSWORD;
    await existing.save();
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "ADMIN",
    });
  }

  let category = await Category.findOne();
  if (!category) {
    category = await Category.create({
      name: { en: "Test Category", ar: "فئة تجريبية" },
      status: "visible",
    });
  }

  let product = await Product.findOne({ deletedAt: null });
  if (!product) {
    product = await Product.create({
      name: { en: "Test Product", ar: "منتج تجريبي" },
      price: 99.99,
      stock: 50,
      category: category._id,
      status: "ACTIVE",
    });
  }

  const orderCount = await Order.countDocuments();
  if (orderCount === 0) {
    const order = await Order.create({
      user: null,
      items: [{ product: product._id, quantity: 2, price: 99.99 }],
      total: 199.98,
      deliveryFee: 0,
      paymentMethod: "COD",
      status: "PENDING",
      guestName: "E2E Test Guest",
      guestEmail: "e2e@test.com",
      shippingAddress: { address: "123 Test St", city: "Cairo" },
    });
    await Payment.create({
      order: order._id,
      method: "COD",
      status: "UNPAID",
    });
  }

  await mongoose.disconnect();
  console.log("Seed test data complete: admin, category, product, order");
  process.exit(0);
}

seedTestData().catch((err) => {
  console.error("Seed test failed:", err);
  process.exit(1);
});
