import { z } from "zod";

export const createFeedbackSchema = z.object({
  body: z.object({
    /** Required: Product ID. */
    product: z.string().trim().min(1, "Product is required"),
    /** Required: Customer display name. */
    customerName: z.string().trim().min(1, "Customer name is required").max(200, "Customer name must be at most 200 characters"),
    /** Required: Review message. */
    message: z.string().trim().min(1, "Message is required").max(2000, "Message must be at most 2000 characters"),
    /** Required: Rating 1–5. */
    rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
    /** Optional: Image URL or path. */
    image: z.string().trim().max(500).optional(),
    /** Optional: Admin approval status. */
    approved: z.boolean().optional().default(false),
    /** Optional: Display order. */
    order: z.number().int().min(0).optional().default(0)
  })
});

export const updateFeedbackSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Feedback ID is required") }),
  body: z.object({
    product: z.string().trim().min(1).optional(),
    customerName: z.string().trim().min(1).max(200).optional(),
    message: z.string().trim().min(1).max(2000).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    image: z.string().trim().max(500).optional(),
    approved: z.boolean().optional(),
    order: z.number().int().min(0).optional()
  }).refine((b) => Object.keys(b).length > 0, { message: "At least one field to update is required" })
});

export const feedbackIdParamSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Feedback ID is required") })
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
  params: z.object({ id: z.string().trim().min(1, "Feedback ID is required") }),
  body: z.object({ approved: z.boolean() })
});
