import { z } from "zod";

export const categorySchema = z.object({
  body: z.object({
    nameEn: z.string().min(1, "Name (EN) required"),
    nameAr: z.string().min(1, "Name (AR) required"),
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
    status: z.enum(["visible", "hidden"]).optional()
  })
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const categoryStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(["visible", "hidden"]) })
});

/** Query for list categories (store: filter by status, e.g. PUBLISHED/visible) */
export const categoryQuerySchema = z.object({
  query: z.object({
    status: z.enum(["visible", "hidden", "PUBLISHED"]).optional()
  })
});
