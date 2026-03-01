import { z } from "zod";

export const stockUpdateSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Product ID is required") }),
  body: z.object({
    /** Required: New stock quantity (0 or greater). */
    stock: z.number().int().nonnegative("Stock must be 0 or greater").max(10000000)
  })
});
