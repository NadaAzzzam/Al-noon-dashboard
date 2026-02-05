import { Order } from "../models/Order.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listOrders = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ orders: [] });
    return;
  }
  const query = _req.auth?.role === "ADMIN" ? {} : { user: _req.auth?.userId };
  const orders = await Order.find(query)
    .populate("user", "name email")
    .populate("items.product", "name price")
    .sort({ createdAt: -1 });
  res.json({ orders });
});

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized");
  }
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const { items } = req.body;
  const total = items.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
  const order = await Order.create({ user: req.auth.userId, items, total });
  res.status(201).json({ order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  order.status = req.body.status;
  await order.save();
  res.json({ order });
});
