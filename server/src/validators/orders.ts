import { z } from "zod";

const orderStatusEnum = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);

/** Structured address schema (Shopify-style) – Egypt only. Required for delivery. */
const structuredAddressSchema = z.object({
  /** Required: Street address. */
  address: z.string().trim().min(1, "Address is required").max(500, "Address must be at most 500 characters"),
  /** Optional: Apartment, suite, building. */
  apartment: z.string().trim().max(100).optional().default(""),
  /** Required: City name or ID. */
  city: z.string().trim().min(1, "City is required").max(100),
  /** Optional: Postal code. */
  postalCode: z.string().trim().max(20).optional().default(""),
  /** Optional: Country (defaults to Egypt). */
  country: z.string().trim().max(50).optional().default("Egypt")
});

const orderItemSchema = z.object({
  /** Required: Product ID. */
  product: z.string().trim().min(1, "Product ID is required"),
  /** Required: Quantity (positive integer). */
  quantity: z.number().int().positive("Quantity must be at least 1"),
  /** Required: Unit price in EGP. */
  price: z.number().positive("Price must be greater than 0")
});

const orderBodyBase = z.object({
  /** Required: At least one item. */
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  /** Required: Shipping address for delivery. Flat string or structured. */
  shippingAddress: z.union([
    z.string().trim().min(1, "Shipping address is required").max(1000),
    structuredAddressSchema
  ], { errorMap: () => ({ message: "Shipping address is required for delivery" }) }),
  /** Optional: Payment method. */
  paymentMethod: z.enum(["COD", "INSTAPAY"]).optional(),
  /** Optional: Delivery fee (calculated server-side if omitted). */
  deliveryFee: z.number().min(0, "Delivery fee cannot be negative").max(100000).optional(),
  /** Optional: Guest name (required for guest checkout when not authenticated). */
  guestName: z.string().trim().min(1).max(200).optional(),
  /** Optional: Guest email (required for guest checkout). */
  guestEmail: z.string().email("Valid email is required").optional(),
  /** Optional: Guest phone (recommended for delivery coordination). */
  guestPhone: z.string().trim().max(30).optional(),
  /** Optional: Customer email (Shopify-style). */
  email: z.string().email().optional(),
  /** Optional: First name (Shopify-style). */
  firstName: z.string().trim().min(1).max(100).optional(),
  /** Optional: Last name (Shopify-style). */
  lastName: z.string().trim().min(1).max(100).optional(),
  /** Optional: Phone number. */
  phone: z.string().trim().max(30).optional(),
  /** Optional: Billing address (null = same as shipping). */
  billingAddress: structuredAddressSchema.nullable().optional(),
  /** Optional: Delivery notes. */
  specialInstructions: z.string().trim().max(1000).optional(),
  /** Optional: Shipping method ID. */
  shippingMethod: z.string().trim().max(100).optional().default("standard"),
  /** Optional: Subscribe to email newsletter. */
  emailNews: z.boolean().optional().default(false),
  /** Optional: Subscribe to SMS newsletter. */
  textNews: z.boolean().optional().default(false),
  /** Optional: Discount code to apply. */
  discountCode: z.string().trim().max(50).optional()
});

export const orderSchema = z.object({ body: orderBodyBase });

export const orderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: orderStatusEnum
  })
});

export const orderParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const orderQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: orderStatusEnum.optional(),
    paymentMethod: z.enum(["COD", "INSTAPAY"]).optional()
  })
});
