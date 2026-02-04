import mongoose, { Schema } from "mongoose";

export interface OrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface OrderDocument {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  total: number;
  status: "PENDING" | "PAID" | "SHIPPED";
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PAID", "SHIPPED"], default: "PENDING" }
  },
  { timestamps: true }
);

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
