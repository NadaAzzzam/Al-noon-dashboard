import { z } from "zod";

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().positive(),
    stock: z.number().int().nonnegative(),
    category: z.string().min(1),
    status: z.enum(["ACTIVE", "DRAFT"]).optional()
  })
});

export const productParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});
