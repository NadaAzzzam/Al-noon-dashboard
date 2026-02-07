import { z } from "zod";

export const citySchema = z.object({
  body: z.object({
    nameEn: z.string().min(1).max(100).trim(),
    nameAr: z.string().min(1).max(100).trim(),
    deliveryFee: z.number().min(0).optional()
  })
});

export const cityParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const cityUpdateSchema = citySchema.merge(cityParamsSchema);
