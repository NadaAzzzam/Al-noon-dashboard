import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Payment } from "../models/Payment.js";
import { Product } from "../models/Product.js";
import { isDbConnected } from "../config/db.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const attachPaymentProof = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const url = typeof req.body.instaPayProofUrl === "string" ? req.body.instaPayProofUrl.trim() : "";
  if (!url) throw new ApiError(400, "instaPayProofUrl required");
  const payment = await Payment.findOne({ order: req.params.id });
  if (!payment) {
    throw new ApiError(404, "Payment not found for this order");
  }
  if (payment.method !== "INSTAPAY") {
    throw new ApiError(400, "Only InstaPay orders can have proof attached");
  }
  payment.instaPayProofUrl = url;
  await payment.save();
  res.json({ payment });
});

export const confirmPayment = asyncHandler(async (req, res) => {
  if (!isDbConnected()) throw new ApiError(503, "Database not available (dev mode).");
  const approved = req.body.approved === true;
  const payment = await Payment.findOne({ order: req.params.id });
  if (!payment) {
    throw new ApiError(404, "Payment not found for this order");
  }
  if (payment.method !== "INSTAPAY") {
    throw new ApiError(400, "Only InstaPay payments can be approved/rejected");
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
  res.json({ payment });
});
