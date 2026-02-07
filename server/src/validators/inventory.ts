import { z } from "zod";

export const stockUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ stock: z.number().int().nonnegative() })
});
