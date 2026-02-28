import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/apiError.js";
import { isDbConnected } from "../config/db.js";
import { paymentProofPath } from "../middlewares/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const attachPaymentProof = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available", { code: "errors.common.db_unavailable" });
  const file = req.file;
  if (!file) throw new ApiError(400, "Payment proof file is required", { code: "errors.payment.proof_required" });
  const payment = await Payment.findOne({ order: req.params.id });
  if (!payment) {
    throw new ApiError(404, "Payment not found for this order", { code: "errors.payment.not_found" });
  }
  if (payment.method !== "INSTAPAY") {
    throw new ApiError(400, "Only InstaPay can have proof attached", { code: "errors.payment.instapay_only" });
  }
  payment.instaPayProofUrl = paymentProofPath(file.filename);
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
    const uid = req.auth?.userId;
    payment.approvedBy = uid && /^[a-fA-F0-9]{24}$/.test(uid) ? new mongoose.Types.ObjectId(uid) : undefined;
    const order = await Order.findById(req.params.id);
    if (order && order.items.length > 0) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        for (const item of order.items) {
          const result = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
          );
          if (!result) {
            await session.abortTransaction();
            const prod = await Product.findById(item.product).select("name").lean();
            const name = (prod as { name?: { en?: string; ar?: string } })?.name?.en
              ?? (prod as { name?: { en?: string; ar?: string } })?.name?.ar ?? "Product";
            throw new ApiError(409, `${name} became out of stock; payment cannot be confirmed`, {
              code: "errors.order.out_of_stock_confirmation",
              params: { productName: (prod as { name?: { en?: string; ar?: string } })?.name?.en ?? "Product" }
            });
          }
        }
        await session.commitTransaction();
      } finally {
        session.endSession();
      }
    }
  } else {
    payment.approvedAt = undefined;
    payment.approvedBy = undefined;
    payment.instaPayProofUrl = undefined; // Reject = clear proof so customer can re-upload
  }
  await payment.save();
  if (approved) {
    await Order.findByIdAndUpdate(req.params.id, { status: "CONFIRMED" });
  }
  sendResponse(res, req.locale, { message: "success.payment.confirmed", data: { payment } });
});
