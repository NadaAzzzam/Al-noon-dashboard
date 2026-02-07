import { z } from "zod";

const localizedBody = z.object({
  nameEn: z.string().min(1, "Name (EN) required"),
  nameAr: z.string().min(1, "Name (AR) required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional()
});

export const productSchema = z.object({
  body: localizedBody.merge(z.object({
    price: z.number().positive(),
    discountPrice: z.number().positive().optional(),
    stock: z.number().int().nonnegative(),
    category: z.string().min(1),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    images: z.array(z.string()).optional(),
    imageColors: z.array(z.string()).optional(),
    sizes: z.array(z.string()).optional(),
    sizeDescriptions: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional()
  }))
});

export const productParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    category: z.string().optional()
  })
});

export const productStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
});
