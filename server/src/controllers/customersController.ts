import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listCustomers = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ customers: [] });
    return;
  }
  const users = await User.find({ role: "USER" })
    .select("name email createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json({
    customers: users.map((u) => ({ id: u._id, name: u.name, email: u.email, createdAt: u.createdAt }))
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const user = await User.findOne({ _id: req.params.id, role: "USER" }).select("name email createdAt").lean();
  if (!user) throw new ApiError(404, "Customer not found");
  res.json({ customer: { id: user._id, ...user } });
});

export const getCustomerOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const user = await User.findOne({ _id: req.params.id, role: "USER" });
  if (!user) throw new ApiError(404, "Customer not found");
  const orders = await Order.find({ user: user.id })
    .populate("items.product", "name price")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ orders });
});
