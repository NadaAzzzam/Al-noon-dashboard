import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Settings } from "../models/Settings.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const defaultLimit = 20;

export const listOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    res.json({ orders: [], total: 0, page: 1, limit: defaultLimit, totalPages: 0 });
    return;
  }
  const isAdmin = req.auth?.role === "ADMIN";
  const filter: Record<string, unknown> = isAdmin ? {} : { user: req.auth?.userId };
  const status = req.query.status as string | undefined;
  const paymentMethod = req.query.paymentMethod as string | undefined;
  if (status) filter.status = status;
  if (paymentMethod) filter.paymentMethod = paymentMethod;

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || defaultLimit, 100);

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

  res.json({
    orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 0
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "name price discountPrice images");
  if (!order) throw new ApiError(404, "Order not found");
  const isAdmin = req.auth?.role === "ADMIN";
  if (!isAdmin && String(order.user._id) !== req.auth?.userId) {
    throw new ApiError(403, "Forbidden");
  }
  res.json({ order });
});

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Unauthorized");
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const { items, paymentMethod = "COD", shippingAddress } = req.body;
  const subtotal = items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
  const settings = await Settings.findOne().lean();
  const deliveryFee = settings?.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const order = await Order.create({
    user: req.auth.userId,
    items,
    total,
    deliveryFee,
    paymentMethod,
    paymentStatus: paymentMethod === "INSTAPAY" ? "PENDING_APPROVAL" : "UNPAID",
    shippingAddress
  });
  res.status(201).json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  const newStatus = req.body.status;

  if (newStatus === "CANCELLED") {
    order.status = "CANCELLED";
    await order.save();
    const populated = await Order.findById(order.id)
      .populate("user", "name email")
      .populate("items.product", "name price");
    res.json({ order: populated });
    return;
  }

  const validTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: []
  };
  const allowed = validTransitions[order.status];
  if (!allowed?.includes(newStatus)) {
    throw new ApiError(400, `Cannot change status from ${order.status} to ${newStatus}`);
  }

  if (newStatus === "CONFIRMED") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  order.status = newStatus;
  await order.save();
  const populated = await Order.findById(order.id)
    .populate("user", "name email")
    .populate("items.product", "name price");
  res.json({ order: populated });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new ApiError(400, "Only PENDING or CONFIRMED orders can be cancelled");
  }
  order.status = "CANCELLED";
  await order.save();
  const populated = await Order.findById(order.id)
    .populate("user", "name email")
    .populate("items.product", "name price");
  res.json({ order: populated });
});

export const updateOrderPayment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (req.body.paymentStatus !== undefined) {
    order.paymentStatus = req.body.paymentStatus;
    if (req.body.paymentStatus === "PAID" && order.status === "PENDING") {
      order.status = "CONFIRMED";
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }
  }
  if (req.body.instaPayProof !== undefined) order.instaPayProof = req.body.instaPayProof;
  await order.save();
  const populated = await Order.findById(order.id)
    .populate("user", "name email")
    .populate("items.product", "name price");
  res.json({ order: populated });
});

export const attachPaymentProof = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentMethod !== "INSTAPAY") {
    throw new ApiError(400, "Order is not InstaPay");
  }
  order.instaPayProof = req.body.instaPayProof ?? "";
  order.paymentStatus = "PENDING_APPROVAL";
  await order.save();
  const populated = await Order.findById(order.id)
    .populate("user", "name email")
    .populate("items.product", "name price");
  res.json({ order: populated });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  order.paymentStatus = "PAID";
  if (order.status === "PENDING") {
    order.status = "CONFIRMED";
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }
  await order.save();
  const populated = await Order.findById(order.id)
    .populate("user", "name email")
    .populate("items.product", "name price");
  res.json({ order: populated });
});
