import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  body: z.object({
    /** Required: Subscriber email. */
    email: z.string().trim().toLowerCase().email("Valid email is required").max(254, "Email is too long")
  })
});
