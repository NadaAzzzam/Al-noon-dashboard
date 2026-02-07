import { Order } from "../models/Order.js";
import { User } from "../models/User.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (_req, res) => {
  if (!isDbConnected()) {
    res.json({ users: [] });
    return;
  }
  const users = await User.find()
    .select("name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.json({
    users: users.map((u) => ({
      id: (u as { _id: unknown })._id,
      name: (u as { name: string }).name,
      email: (u as { email: string }).email,
      role: (u as { role: string }).role,
      createdAt: (u as { createdAt: Date }).createdAt
    }))
  });
});

export const getCustomer = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const user = await User.findById(req.params.id).select("name email role createdAt").lean();
  if (!user) {
    throw new ApiError(404, "Customer not found");
  }
  res.json({
    customer: {
      id: (user as { _id: unknown })._id,
      name: (user as { name: string }).name,
      email: (user as { email: string }).email,
      role: (user as { role: string }).role,
      createdAt: (user as { createdAt: Date }).createdAt
    }
  });
});

export const getCustomerOrders = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const orders = await Order.find({ user: req.params.id })
    .populate("items.product", "name price")
    .sort({ createdAt: -1 })
    .lean();
  res.json({ orders });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const { id } = req.params;
  const { role } = req.body;
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.role = role;
  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
