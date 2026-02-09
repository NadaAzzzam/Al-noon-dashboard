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
    isNewArrival: z.boolean().optional(),
    images: z.array(z.string()).optional(),
    viewImage: z.string().optional(),
    hoverImage: z.string().optional(),
    imageColors: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    detailsEn: z.string().optional(),
    detailsAr: z.string().optional(),
    stylingTipEn: z.string().optional(),
    stylingTipAr: z.string().optional(),
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
    category: z.string().optional(),
    newArrival: z.enum(["true", "false"]).optional(),
    /** E-commerce: inStock | outOfStock | all */
    availability: z.enum(["inStock", "outOfStock", "all"]).optional(),
    /** E-commerce: filter by color (e.g. Black, Navy). Case-insensitive match on product.colors */
    color: z.string().optional(),
    /** E-commerce: min price (EGP) */
    minPrice: z.coerce.number().min(0).optional(),
    /** E-commerce: max price (EGP) */
    maxPrice: z.coerce.number().min(0).optional(),
    /** E-commerce: newest | priceAsc | priceDesc | nameAsc | nameDesc | bestSelling | highestSelling | lowSelling */
    sort: z.enum(["newest", "priceAsc", "priceDesc", "nameAsc", "nameDesc", "bestSelling", "highestSelling", "lowSelling"]).optional(),
    /** Admin: only products with average rating (approved feedback) >= this value (1–5) */
    minRating: z.coerce.number().min(1).max(5).optional()
  })
});

export const productStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["ACTIVE", "INACTIVE"]) })
});
