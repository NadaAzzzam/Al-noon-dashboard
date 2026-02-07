import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ orders: [], total: 0, page: 1, limit: 20, totalPages: 0 });
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

  res.json({
    orders: withPayment,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name price discountPrice images stock");
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  const isAdmin = req.auth?.role === "ADMIN";
  if (!isAdmin && order.user._id.toString() !== req.auth?.userId) {
    throw new ApiError(403, "Forbidden");
  }
  const payment = await Payment.findOne({ order: order._id }).lean();
  res.json({
    order: {
      ...order.toObject(),
      payment: payment ?? (order.paymentMethod ? { method: order.paymentMethod, status: "UNPAID" } : undefined)
    }
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized");
  }
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
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
  res.status(201).json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  const newStatus = req.body.status;
  order.status = newStatus;
  await order.save();
  if (newStatus === "CONFIRMED") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }
  res.json({ order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new ApiError(400, "Only pending or confirmed orders can be cancelled");
  }
  const wasConfirmed = order.status === "CONFIRMED";
  order.status = "CANCELLED";
  await order.save();
  if (wasConfirmed) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }
  res.json({ order });
});
