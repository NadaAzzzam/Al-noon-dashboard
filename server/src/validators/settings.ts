import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    storeName: z.string().min(1).optional(),
    logo: z.string().optional(),
    deliveryFee: z.number().min(0).optional(),
    instaPayNumber: z.string().optional(),
    paymentMethods: z.object({ cod: z.boolean(), instaPay: z.boolean() }).optional(),
    lowStockThreshold: z.number().int().min(0).optional()
  })
});
