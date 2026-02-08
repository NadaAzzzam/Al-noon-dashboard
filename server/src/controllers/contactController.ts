import { ContactSubmission } from "../models/ContactSubmission.js";
import { isDbConnected } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

/** Admin: list contact form submissions with pagination. */
export const listContactSubmissions = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return sendResponse(res, req.locale, {
      data: { submissions: [] },
      pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
    });
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const total = await ContactSubmission.countDocuments({});
  const submissions = await ContactSubmission.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  const totalPages = Math.ceil(total / limit) || 1;
  sendResponse(res, req.locale, {
    data: { submissions },
    pagination: { total, page, limit, totalPages }
  });
});
