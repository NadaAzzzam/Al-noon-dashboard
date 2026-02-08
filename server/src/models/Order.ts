import mongoose, { Schema } from "mongoose";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface OrderDocument {
  user: mongoose.Types.ObjectId;
  items: OrderItem[];
  total: number;
  /** Delivery/shipping fee in EGP. Optional for backwards compatibility. */
  deliveryFee?: number;
  status: OrderStatus;
  paymentMethod?: "COD" | "INSTAPAY";
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
    deliveryFee: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING"
    },
    paymentMethod: { type: String, enum: ["COD", "INSTAPAY"] },
    shippingAddress: { type: String }
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
