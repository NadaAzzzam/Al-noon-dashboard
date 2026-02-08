import { z } from "zod";

export const submitContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(50).optional(),
    comment: z.string().min(1, "Comment is required").max(5000)
  })
});

export const listContactQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  })
});
