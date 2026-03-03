import { z } from "zod";

export const applyDiscountSchema = z.object({
  body: z.object({
    /** Discount code to validate (e.g. SAVE10) */
    discountCode: z.string().trim().min(1, "Discount code is required").max(50),
    /** Cart/order subtotal in EGP (before discount). Used to validate minOrderAmount. */
    subtotal: z.number().min(0, "Subtotal must be at least 0"),
    /** Guest: email for per-identity usage check. Optional for preview without identity. */
    email: z.string().max(255).optional(),
    /** Guest: phone for per-identity usage check. Optional. */
    phone: z.string().max(20).optional(),
  }),
});

export type ApplyDiscountBody = z.infer<typeof applyDiscountSchema>["body"];
