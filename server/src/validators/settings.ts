import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    storeName: z.string().optional(),
    logo: z.string().optional(),
    instaPayNumber: z.string().optional(),
    paymentMethods: z
      .object({
        cod: z.boolean().optional(),
        instaPay: z.boolean().optional()
      })
      .optional(),
    lowStockThreshold: z.number().int().min(0).optional()
  })
});
