import { z } from "zod";

export const idParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Role ID is required"),
  }),
});

export const roleCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Role name is required").max(100),
    key: z.string().min(1, "Role key is required").max(50).regex(/^[A-Z0-9_]+$/, "Key must be uppercase letters, numbers, and underscores"),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string()).optional(),
  }),
});

export const roleUpdateSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Role ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    permissionIds: z.array(z.string()).optional(),
  }),
});
