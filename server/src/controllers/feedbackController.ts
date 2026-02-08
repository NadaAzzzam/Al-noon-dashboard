import type { Request } from "express";
import { ProductFeedback } from "../models/ProductFeedback.js";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { feedbackImagePath } from "../middlewares/upload.js";

/** Admin: list feedback with pagination and optional filters. */
export const listFeedback = asyncHandler(async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ feedback: [], total: 0, page: 1, limit: 20, totalPages: 0 });
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const approved = req.query.approved === "true" ? true : req.query.approved === "false" ? false : undefined;
  const productId = typeof req.query.product === "string" && req.query.product.trim() ? req.query.product.trim() : undefined;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (approved !== undefined) filter.approved = approved;
  if (productId) filter.product = productId;
  const total = await ProductFeedback.countDocuments(filter);
  const feedback = await ProductFeedback.find(filter)
    .sort({ order: 1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("product", "name")
    .lean();
  const totalPages = Math.ceil(total / limit) || 1;
  res.json({
    feedback,
    total,
    page,
    limit,
    totalPages
  });
});

/** Admin: get one feedback by id. */
export const getFeedback = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available.");
  const id = req.params.id;
  const item = await ProductFeedback.findById(id).populate("product", "name").lean();
  if (!item) throw new ApiError(404, "Feedback not found.");
  res.json({ feedback: item });
});

/** Admin: create feedback (e.g. from customer message screenshot). */
export const createFeedback = asyncHandler(async (req: Request, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available.");
  const body = req.body as { product?: string; customerName?: string; message?: string; rating?: number; image?: string; approved?: boolean; order?: number };
  const product = body.product?.trim();
  const customerName = body.customerName?.trim();
  const message = body.message?.trim();
  const rating = body.rating != null ? Number(body.rating) : undefined;
  if (!product) throw new ApiError(400, "Product is required.");
  if (!customerName) throw new ApiError(400, "Customer name is required.");
  if (!message) throw new ApiError(400, "Message is required.");
  if (rating == null || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5.");
  const productExists = await Product.findById(product).select("_id").lean();
  if (!productExists) throw new ApiError(400, "Product not found.");
  let image = (body.image as string)?.trim() || "";
  if ((req as Request & { file?: { filename: string } }).file) {
    image = feedbackImagePath((req as Request & { file: { filename: string } }).file.filename);
  }
  const order = body.order != null ? Math.max(0, Math.floor(Number(body.order))) : 0;
  const approved = Boolean(body.approved);
  const doc = await ProductFeedback.create({
    product,
    customerName,
    message,
    rating,
    image: image || undefined,
    approved,
    order
  });
  const populated = await ProductFeedback.findById(doc._id).populate("product", "name").lean();
  res.status(201).json({ feedback: populated ?? doc });
});

/** Admin: update feedback. */
export const updateFeedback = asyncHandler(async (req: Request, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available.");
  const id = req.params.id;
  const body = req.body as { product?: string; customerName?: string; message?: string; rating?: number; image?: string; approved?: boolean; order?: number };
  const doc = await ProductFeedback.findById(id);
  if (!doc) throw new ApiError(404, "Feedback not found.");
  if (body.product !== undefined) {
    const productExists = await Product.findById(body.product).select("_id").lean();
    if (!productExists) throw new ApiError(400, "Product not found.");
    doc.product = body.product as unknown as import("mongoose").Types.ObjectId;
  }
  if (body.customerName !== undefined) doc.customerName = String(body.customerName).trim();
  if (body.message !== undefined) doc.message = String(body.message).trim();
  if (body.rating !== undefined) {
    const r = Number(body.rating);
    if (r < 1 || r > 5) throw new ApiError(400, "Rating must be between 1 and 5.");
    doc.rating = r;
  }
  if (body.image !== undefined) doc.image = String(body.image).trim() || undefined;
  if (body.approved !== undefined) doc.approved = Boolean(body.approved);
  if (body.order !== undefined) doc.order = Math.max(0, Math.floor(Number(body.order)));
  if ((req as Request & { file?: { filename: string } }).file) {
    doc.image = feedbackImagePath((req as Request & { file: { filename: string } }).file.filename);
  }
  await doc.save();
  const populated = await ProductFeedback.findById(doc._id).populate("product", "name").lean();
  res.json({ feedback: populated ?? doc });
});

/** Admin: delete feedback. */
export const deleteFeedback = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available.");
  const id = req.params.id;
  const doc = await ProductFeedback.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, "Feedback not found.");
  res.status(204).send();
});

/** Admin: set approved status. */
export const setFeedbackApproved = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available.");
  const id = req.params.id;
  const approved = Boolean((req.body as { approved?: boolean }).approved);
  const doc = await ProductFeedback.findByIdAndUpdate(id, { approved }, { new: true }).populate("product", "name").lean();
  if (!doc) throw new ApiError(404, "Feedback not found.");
  res.json({ feedback: doc });
});

/** Admin: upload feedback/screenshot image. Returns { image: "/uploads/feedback/..." }. */
export const uploadFeedbackImage = asyncHandler(async (req: Request, res) => {
  const file = (req as Request & { file?: { filename: string } }).file;
  if (!file) throw new ApiError(400, "No image file uploaded. Select an image (PNG, JPG, GIF, WEBP).");
  const pathUrl = feedbackImagePath(file.filename);
  res.json({ image: pathUrl });
});
