import mongoose, { Schema } from "mongoose";

export interface ProductDocument {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  status: "ACTIVE" | "INACTIVE";
  images: string[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, required: true, default: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    images: { type: [String], default: [] },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ category: 1, deletedAt: 1 });
productSchema.index({ status: 1, deletedAt: 1 });

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
