import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signToken = (userId: string, role: "ADMIN" | "USER") =>
  jwt.sign({ userId, role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    throw new ApiError(409, "User already exists");
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user.id, user.role);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  const token = signToken(user.id, user.role);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.auth) {
    throw new ApiError(401, "Unauthorized");
  }
  const user = await User.findById(req.auth.userId).select("name email role");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  res.json({ user });
});
