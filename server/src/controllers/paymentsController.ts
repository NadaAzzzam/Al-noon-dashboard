import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const attachPaymentProof = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const url = typeof req.body.instaPayProofUrl === "string" ? req.body.instaPayProofUrl.trim() : "";
  if (!url) throw new ApiError(400, "Payment proof URL is required", { code: "errors.payment.proof_required" });
  const payment = await Payment.findOne({ order: req.params.id });
  if (!payment) {
    throw new ApiError(404, "Payment not found for this order", { code: "errors.payment.not_found" });
  }
  if (payment.method !== "INSTAPAY") {
    throw new ApiError(400, "Only InstaPay can have proof attached", { code: "errors.payment.instapay_only" });
  }
  payment.instaPayProofUrl = url;
  await payment.save();
  sendResponse(res, req.locale, { message: "success.payment.proof_attached", data: { payment } });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const approved = req.body.approved === true;
  const payment = await Payment.findOne({ order: req.params.id });
  if (!payment) {
    throw new ApiError(404, "Payment not found for this order", { code: "errors.payment.not_found" });
  }
  if (payment.method !== "INSTAPAY") {
    throw new ApiError(400, "Only InstaPay payments can be processed", { code: "errors.payment.instapay_only" });
  }
  payment.status = approved ? "PAID" : "UNPAID";
  if (approved) {
    payment.approvedAt = new Date();
    payment.approvedBy = req.auth?.userId ? new mongoose.Types.ObjectId(req.auth.userId) : undefined;
  } else {
    payment.approvedAt = undefined;
    payment.approvedBy = undefined;
  }
  await payment.save();
  if (approved) {
    await Order.findByIdAndUpdate(req.params.id, { status: "CONFIRMED" });
    const order = await Order.findById(req.params.id);
    if (order) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
    }
  }
  sendResponse(res, req.locale, { message: "success.payment.confirmed", data: { payment } });
});
