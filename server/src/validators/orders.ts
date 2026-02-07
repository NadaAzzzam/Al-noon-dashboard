import { z } from "zod";

const orderStatusEnum = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);

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
    shippingAddress: z.string().optional()
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
