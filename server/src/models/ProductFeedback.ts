import mongoose, { Schema } from "mongoose";

export interface ProductFeedbackDocument {
  product: mongoose.Types.ObjectId;
  customerName: string;
  message: string;
  /** 1–5 stars */
  rating: number;
  /** Optional screenshot/image (e.g. from customer message). */
  image?: string;
  /** When true, shown on storefront home page. */
  approved: boolean;
  /** Display order (lower first). */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const productFeedbackSchema = new Schema<ProductFeedbackDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    customerName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    image: { type: String, default: "" },
    approved: { type: Boolean, default: false },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productFeedbackSchema.index({ approved: 1, order: 1, createdAt: -1 });
productFeedbackSchema.index({ product: 1 });

export const ProductFeedback = mongoose.model<ProductFeedbackDocument>(
  "ProductFeedback",
  productFeedbackSchema
);
