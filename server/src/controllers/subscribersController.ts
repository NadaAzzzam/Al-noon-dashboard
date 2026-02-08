import { Subscriber } from "../models/Subscriber.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const listSubscribers = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: { subscribers: [] },
      pagination: { total: 0, page: 1, limit: 50, totalPages: 0 }
    });
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const [subscribers, total] = await Promise.all([
    Subscriber.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Subscriber.countDocuments()
  ]);
  const totalPages = Math.ceil(total / limit);
  sendResponse(res, req.locale, {
    data: { subscribers: subscribers.map((s) => ({ email: s.email, createdAt: s.createdAt })) },
    pagination: { total, page, limit, totalPages }
  });
});
