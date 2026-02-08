import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { sendMail } from "../utils/email.js";

export const listOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const isAdmin = req.auth?.role === "ADMIN";
  const filter: Record<string, unknown> = isAdmin ? {} : { user: req.auth?.userId };

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const status = req.query.status as string | undefined;
  const paymentMethod = req.query.paymentMethod as string | undefined;
  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name price discountPrice images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  const orderIds = orders.map((o) => (o as { _id: unknown })._id);
  const payments = await Payment.find({ order: { $in: orderIds } }).lean();
  const paymentByOrder = Object.fromEntries(
    payments.map((p) => {
      const oid = (p as { order: { toString: () => string } }).order;
      return [typeof oid === "object" && oid && "toString" in oid ? oid.toString() : String(oid), p];
    })
  );

  const withPayment = orders.map((o) => {
    const ord = o as { _id: { toString: () => string }; paymentMethod?: string };
    const pay = paymentByOrder[ord._id.toString()];
    return {
      ...ord,
      payment: pay
        ? {
            method: (pay as { method: string }).method,
            status: (pay as { status: string }).status,
            instaPayProofUrl: (pay as { instaPayProofUrl?: string }).instaPayProofUrl
          }
        : ord.paymentMethod
        ? { method: ord.paymentMethod, status: "UNPAID" as const }
        : undefined
    };
  });

  sendResponse(res, req.locale, {
    data: withPayment,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name price discountPrice images stock");
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const isAdmin = req.auth?.role === "ADMIN";
  if (!isAdmin && order.user._id.toString() !== req.auth?.userId) {
    throw new ApiError(403, "Forbidden", { code: "errors.common.forbidden" });
  }
  const payment = await Payment.findOne({ order: order._id }).lean();
  sendResponse(res, req.locale, {
    data: {
      order: {
        ...order.toObject(),
        payment: payment ?? (order.paymentMethod ? { method: order.paymentMethod, status: "UNPAID" } : undefined)
      }
    }
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized", { code: "errors.auth.unauthorized" });
  }
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const { items, paymentMethod, shippingAddress } = req.body;
  const total = items.reduce(
    (sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price,
    0
  );
  const order = await Order.create({
    user: req.auth.userId,
    items,
    total,
    paymentMethod: paymentMethod || "COD",
    shippingAddress
  });
  await Payment.create({
    order: order._id,
    method: paymentMethod || "COD",
    status: paymentMethod === "INSTAPAY" ? "UNPAID" : "UNPAID"
  });

  // Notify admin by email if enabled (fire-and-forget)
  Settings.findOne().lean().then(async (settingsRow) => {
    const settings = settingsRow as { orderNotificationsEnabled?: boolean; orderNotificationEmail?: string } | null;
    if (!settings?.orderNotificationsEnabled) return;
    const to = (settings.orderNotificationEmail?.trim() || env.adminEmail || "").toLowerCase();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return;
    const populated = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name");
    if (!populated) return;
    const user = populated.user as { name?: string; email?: string } | null;
    const items = (populated.items || []).map((item: { product?: { name?: string }; quantity: number; price: number }) => {
      const name = item.product && typeof item.product === "object" && "name" in item.product ? String((item.product as { name?: string }).name) : "—";
      return `${name} × ${item.quantity} = ${item.quantity * item.price}`;
    });
    const subject = `New order #${order._id}`;
    const html = `
      <h2>New order received</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Customer:</strong> ${user?.name ?? "—"} (${user?.email ?? "—"})</p>
      <p><strong>Payment:</strong> ${order.paymentMethod ?? "COD"}</p>
      <p><strong>Shipping:</strong> ${order.shippingAddress ?? "—"}</p>
      <p><strong>Total:</strong> ${order.total}</p>
      <h3>Items</h3>
      <ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>
    `;
    await sendMail(to, subject, html);
  }).catch(() => {});

  sendResponse(res, req.locale, { status: 201, message: "success.order.created", data: { order } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  const newStatus = req.body.status;
  order.status = newStatus;
  await order.save();
  if (newStatus === "CONFIRMED") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }
  sendResponse(res, req.locale, { message: "success.order.status_updated", data: { order } });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found", { code: "errors.order.not_found" });
  }
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new ApiError(400, "Only pending or confirmed orders can be cancelled", { code: "errors.order.cancel_not_allowed" });
  }
  const wasConfirmed = order.status === "CONFIRMED";
  order.status = "CANCELLED";
  await order.save();
  if (wasConfirmed) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  sendResponse(res, req.locale, { message: "success.order.cancelled", data: { order } });
});
