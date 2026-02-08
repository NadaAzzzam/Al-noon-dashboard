import { z } from "zod";

export const chatRequestSchema = z.object({
  body: z.object({
    sessionId: z.string().optional(),
    message: z.string().min(1).max(4000),
    /** Preferred response language (en|ar). If omitted, server uses Accept-Language / x-language. */
    locale: z.enum(["en", "ar"]).optional()
  })
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listSessionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20))
  })
});
