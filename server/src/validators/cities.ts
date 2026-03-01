import { z } from "zod";

export const citySchema = z.object({
  body: z.object({
    /** Required: City name in English. */
    nameEn: z.string().trim().min(1, "Name (EN) is required").max(100, "Name (EN) must be at most 100 characters"),
    /** Required: City name in Arabic. */
    nameAr: z.string().trim().min(1, "Name (AR) is required").max(100, "Name (AR) must be at most 100 characters"),
    /** Optional: Delivery fee in EGP. */
    deliveryFee: z.number().min(0, "Delivery fee cannot be negative").max(100000).optional()
  })
});

export const cityParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "City ID is required")
  })
});

export const cityUpdateSchema = citySchema.merge(cityParamsSchema);
