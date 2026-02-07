import mongoose, { Schema } from "mongoose";

export interface ProductDocument {
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  price: number;
  discountPrice?: number;
  images: string[];
  stock: number;
  status: "ACTIVE" | "INACTIVE";
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

productSchema.index({ deletedAt: 1 });
productSchema.index({ status: 1, deletedAt: 1 });

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
