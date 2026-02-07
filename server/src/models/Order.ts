import mongoose, { Schema } from "mongoose";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "COD" | "INSTAPAY";
export type PaymentStatus = "UNPAID" | "PENDING_APPROVAL" | "PAID";

export interface OrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface OrderDocument {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  total: number;
  deliveryFee?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  instaPayProof?: string;
  shippingAddress?: string;
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
    deliveryFee: { type: Number, default: 0 },
    status: { type: String, enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"], default: "PENDING" },
    paymentMethod: { type: String, enum: ["COD", "INSTAPAY"], default: "COD" },
    paymentStatus: { type: String, enum: ["UNPAID", "PENDING_APPROVAL", "PAID"], default: "UNPAID" },
    instaPayProof: { type: String },
    shippingAddress: { type: String }
  },
  { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
