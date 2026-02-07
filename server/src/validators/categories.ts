import { z } from "zod";

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    isVisible: z.boolean().optional()
  })
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const categoryStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isVisible: z.boolean() })
});
