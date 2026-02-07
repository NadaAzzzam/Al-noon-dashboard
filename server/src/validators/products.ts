import { z } from "zod";

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.number().positive(),
    discountPrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative(),
    category: z.string().min(1),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    images: z.array(z.string().min(1)).optional()
  })
});

export const productParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const productStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
});

export const productStockSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ stock: z.number().int().nonnegative() })
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional()
  })
});
