import { z } from "zod";

export const paymentProofSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ instaPayProofUrl: z.string().min(1) })
});

export const paymentConfirmSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ approved: z.boolean() })
});
