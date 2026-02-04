import mongoose, { Schema } from "mongoose";

export interface ProductDocument {
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  status: "ACTIVE" | "DRAFT";
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    status: { type: String, enum: ["ACTIVE", "DRAFT"], default: "ACTIVE" }
  },
  { timestamps: true }
);

export const Product = mongoose.model<ProductDocument>("Product", productSchema);
