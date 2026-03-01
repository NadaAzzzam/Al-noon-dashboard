import { z } from "zod";

export const chatRequestSchema = z.object({
  body: z.object({
    /** Optional: Continue existing session. */
    sessionId: z.string().trim().min(1).optional(),
    /** Required: User message. */
    message: z.string().trim().min(1, "Message is required").max(4000, "Message must be at most 4000 characters"),
    /** Optional: Response language (en|ar). */
    locale: z.enum(["en", "ar"]).optional()
  })
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Session ID is required")
  })
});

export const listSessionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20))
  })
});
