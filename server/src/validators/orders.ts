import { z } from "zod";

export const orderStatusEnum = z.enum(["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);
export const paymentStatusEnum = z.enum(["UNPAID", "PENDING_APPROVAL", "PAID"]);

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

export const orderParamsSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

export const orderStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: orderStatusEnum })
});

export const orderPaymentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    paymentStatus: paymentStatusEnum.optional(),
    instaPayProof: z.string().optional()
  })
});

export const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: orderStatusEnum.optional(),
    paymentMethod: z.enum(["COD", "INSTAPAY"]).optional()
  })
});
