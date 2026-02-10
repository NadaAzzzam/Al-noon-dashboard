import mongoose, { Schema } from "mongoose";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

/** Structured address (Shopify-style) */
export interface StructuredAddress {
  address: string;
  apartment?: string;
  city: string;
  governorate: string;
  postalCode?: string;
  country?: string; // Always "Egypt" for this store
}

export interface OrderDocument {
  /** Set when order is placed by authenticated user; null for guest checkout */
  user?: mongoose.Types.ObjectId | null;
  items: OrderItem[];
  total: number;
  /** Delivery/shipping fee in EGP. Optional for backwards compatibility. */
  deliveryFee?: number;
  status: OrderStatus;
  paymentMethod?: "COD" | "INSTAPAY";
  /** Mixed: accepts old flat string OR new structured address object */
  shippingAddress?: string | StructuredAddress;
  /** Guest checkout contact info (when user is not set) – kept for backward compat */
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  /** New structured checkout fields (Shopify-style) */
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  billingAddress?: StructuredAddress | null;
  specialInstructions?: string;
  shippingMethod?: string;
  emailNews?: boolean;
  textNews?: boolean;
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

const structuredAddressSchema = new Schema(
  {
    address: { type: String, required: true },
    apartment: { type: String, default: "" },
    city: { type: String, required: true },
    governorate: { type: String, required: true },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Egypt" }
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PENDING"
    },
    paymentMethod: { type: String, enum: ["COD", "INSTAPAY"] },
    // Mixed: accepts old flat string OR new structured address object
    shippingAddress: { type: Schema.Types.Mixed },
    guestName: { type: String },
    guestEmail: { type: String },
    guestPhone: { type: String },
    // New structured checkout fields
    email: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    phone: { type: String, default: null },
    billingAddress: { type: structuredAddressSchema, default: null },
    specialInstructions: { type: String, default: null },
    shippingMethod: { type: String, default: "standard" },
    emailNews: { type: Boolean, default: false },
    textNews: { type: Boolean, default: false }
  },
  { timestamps: true }
);

orderSchema.index({ status: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<OrderDocument>("Order", orderSchema);
