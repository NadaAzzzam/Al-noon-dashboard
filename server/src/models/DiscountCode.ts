import mongoose, { Schema } from "mongoose";

export type DiscountType = "PERCENT" | "FIXED";

export interface DiscountCodeDocument {
  code: string;
  type: DiscountType;
  /** For PERCENT: 1–100. For FIXED: amount in EGP. */
  value: number;
  /** Minimum order subtotal (before discount) in EGP. Optional. */
  minOrderAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  usedCount: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const discountCodeSchema = new Schema<DiscountCodeDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["PERCENT", "FIXED"], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: null },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

discountCodeSchema.index({ enabled: 1, validFrom: 1, validUntil: 1 });

export const DiscountCode = mongoose.model<DiscountCodeDocument>("DiscountCode", discountCodeSchema);
