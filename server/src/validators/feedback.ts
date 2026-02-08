import { z } from "zod";

export const createFeedbackSchema = z.object({
  body: z.object({
    product: z.string().min(1, "Product is required"),
    customerName: z.string().min(1, "Customer name is required").max(200),
    message: z.string().min(1, "Message is required").max(2000),
    rating: z.number().int().min(1).max(5),
    image: z.string().max(500).optional(),
    approved: z.boolean().optional().default(false),
    order: z.number().int().min(0).optional().default(0)
  })
});

export const updateFeedbackSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    product: z.string().min(1).optional(),
    customerName: z.string().min(1).max(200).optional(),
    message: z.string().min(1).max(2000).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    image: z.string().max(500).optional(),
    approved: z.boolean().optional(),
    order: z.number().int().min(0).optional()
  }).refine((b) => Object.keys(b).length > 0, { message: "At least one field to update is required" })
});

export const feedbackIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) })
});

export const listFeedbackQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    approved: z.enum(["true", "false"]).optional(),
    product: z.string().optional()
  })
});

export const approveFeedbackSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ approved: z.boolean() })
});
