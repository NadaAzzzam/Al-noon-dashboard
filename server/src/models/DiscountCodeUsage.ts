import mongoose, { Schema } from "mongoose";

/** Identifier type for discount usage: user (logged-in) or guest (email/phone) */
export type UsageIdentifierType = "userId" | "email" | "phone";

export interface DiscountCodeUsageDocument {
  discountCode: mongoose.Types.ObjectId;
  /** Either userId (ObjectId string) for logged-in, or normalized email/phone for guests */
  identifierType: UsageIdentifierType;
  /** Normalized value: userId string, lowercase email, or digits-only phone */
  identifierValue: string;
  order: mongoose.Types.ObjectId;
  usedAt: Date;
}

const discountCodeUsageSchema = new Schema<DiscountCodeUsageDocument>(
  {
    discountCode: { type: Schema.Types.ObjectId, ref: "DiscountCode", required: true },
    identifierType: { type: String, enum: ["userId", "email", "phone"], required: true },
    identifierValue: { type: String, required: true, trim: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    usedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

discountCodeUsageSchema.index(
  { discountCode: 1, identifierType: 1, identifierValue: 1 },
  { unique: true }
);

export const DiscountCodeUsage = mongoose.model<DiscountCodeUsageDocument>(
  "DiscountCodeUsage",
  discountCodeUsageSchema
);
