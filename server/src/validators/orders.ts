import { z } from "zod";

const orderStatusEnum = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);

/** Structured address schema (Shopify-style) – Egypt only */
const structuredAddressSchema = z.object({
  address: z.string().min(1),
  apartment: z.string().optional().default(""),
  city: z.string().min(1),
  postalCode: z.string().optional().default(""),
  country: z.string().optional().default("Egypt")
});

export const orderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product: z.string().min(1),
          quantity: z.number().int().positive(),
          price: z.number().positive()
        })
      )
      .min(1),
    paymentMethod: z.enum(["COD", "INSTAPAY"]).optional(),
    // Backward compat: accepts flat string OR structured object
    shippingAddress: z.union([z.string(), structuredAddressSchema]).optional(),
    deliveryFee: z.number().min(0).optional(),
    /** Guest checkout: required when not authenticated */
    guestName: z.string().min(1).optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional(),
    // New Shopify-style checkout fields
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    billingAddress: structuredAddressSchema.nullable().optional(),
    specialInstructions: z.string().optional(),
    shippingMethod: z.string().optional().default("standard"),
    emailNews: z.boolean().optional().default(false),
    textNews: z.boolean().optional().default(false)
  })
});

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
