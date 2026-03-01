import { z } from "zod";

const MAX_NAME = 200;
const MAX_DESC = 2000;

export const categorySchema = z.object({
  body: z.object({
    /** Required: Category name in English. */
    nameEn: z.string().trim().min(1, "Name (EN) is required").max(MAX_NAME, `Name (EN) must be at most ${MAX_NAME} characters`),
    /** Required: Category name in Arabic. */
    nameAr: z.string().trim().min(1, "Name (AR) is required").max(MAX_NAME, `Name (AR) must be at most ${MAX_NAME} characters`),
    /** Optional: Description in English. */
    descriptionEn: z.string().trim().max(MAX_DESC).optional(),
    /** Optional: Description in Arabic. */
    descriptionAr: z.string().trim().max(MAX_DESC).optional(),
    /** Optional: Visibility status. */
    status: z.enum(["visible", "hidden"]).optional()
  })
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Category ID is required")
  })
});

export const categoryStatusSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "Category ID is required") }),
  body: z.object({ status: z.enum(["visible", "hidden"]) })
});

/** Query for list categories (store: filter by status, e.g. PUBLISHED/visible) */
export const categoryQuerySchema = z.object({
  query: z.object({
    status: z.enum(["visible", "hidden", "PUBLISHED"]).optional()
  })
});
