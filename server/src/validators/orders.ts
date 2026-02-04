import { z } from "zod";

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
      .min(1)
  })
});

export const orderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(["PENDING", "PAID", "SHIPPED"])
  })
});
