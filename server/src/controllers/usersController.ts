import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("name email role createdAt").sort({ createdAt: -1 });
  res.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }))
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
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
