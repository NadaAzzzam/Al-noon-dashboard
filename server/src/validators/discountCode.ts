import { z } from "zod";

export const discountCodeCreateSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1, "Code is required").max(50),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().min(0, "Value must be at least 0"),
    minOrderAmount: z.number().min(0).optional().nullable(),
    validFrom: z.union([z.string(), z.date()]).optional().nullable(),
    validUntil: z.union([z.string(), z.date()]).optional().nullable(),
    usageLimit: z.number().int().min(0).optional().nullable(),
    enabled: z.boolean().optional().default(true),
  }),
});

export const discountCodeUpdateSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "ID is required") }),
  body: z.object({
    code: z.string().trim().min(1).max(50).optional(),
    type: z.enum(["PERCENT", "FIXED"]).optional(),
    value: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional().nullable(),
    validFrom: z.union([z.string(), z.date()]).optional().nullable(),
    validUntil: z.union([z.string(), z.date()]).optional().nullable(),
    usageLimit: z.number().int().min(0).optional().nullable(),
    enabled: z.boolean().optional(),
  }),
});

export const discountCodeParamsSchema = z.object({
  params: z.object({ id: z.string().trim().min(1, "ID is required") }),
});
