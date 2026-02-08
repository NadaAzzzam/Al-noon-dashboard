import { Subscriber } from "../models/Subscriber.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listSubscribers = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ subscribers: [], total: 0 });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const [subscribers, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Subscriber.countDocuments()
  ]);
  res.json({
    subscribers: subscribers.map((s) => ({ email: s.email, createdAt: s.createdAt })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  });
});
