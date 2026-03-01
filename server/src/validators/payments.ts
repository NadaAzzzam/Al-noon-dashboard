import { z } from "zod";

export const paymentProofSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Order ID is required") }),
  body: z.object({
    /** Required: URL or path to payment proof (screenshot, receipt). */
    instaPayProofUrl: z.string().trim().min(1, "Payment proof URL is required").max(2000)
  })
});

export const paymentConfirmSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Order ID is required") }),
  body: z.object({ approved: z.boolean() })
});
