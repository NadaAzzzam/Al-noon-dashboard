import mongoose, { Schema } from "mongoose";

export type PaymentMethod = "COD" | "INSTAPAY";
export type PaymentStatus = "UNPAID" | "PAID";

export interface PaymentDocument {
  order: mongoose.Types.ObjectId;
  method: PaymentMethod;
  status: PaymentStatus;
  instaPayProofUrl?: string;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    method: { type: String, enum: ["COD", "INSTAPAY"], required: true },
    status: { type: String, enum: ["UNPAID", "PAID"], default: "UNPAID" },
    instaPayProofUrl: { type: String },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });

export const Payment = mongoose.model<PaymentDocument>("Payment", paymentSchema);
