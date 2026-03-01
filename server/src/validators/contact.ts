import { z } from "zod";

export const submitContactSchema = z.object({
  body: z.object({
    /** Required: Sender name. */
    name: z.string().trim().min(1, "Name is required").max(200, "Name must be at most 200 characters"),
    /** Required: Valid email for reply. */
    email: z.string().trim().toLowerCase().email("Valid email is required"),
    /** Optional: Phone number. */
    phone: z.string().trim().max(50).optional(),
    /** Required: Message content. */
    comment: z.string().trim().min(1, "Comment is required").max(5000, "Comment must be at most 5000 characters")
  })
});

export const listContactQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20)
  })
});
