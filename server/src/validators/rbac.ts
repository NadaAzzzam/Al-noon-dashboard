import { z } from "zod";

export const idParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Role ID is required"),
  }),
});

export const roleCreateSchema = z.object({
  body: z.object({
    /** Required: Human-readable role name. */
    name: z.string().trim().min(1, "Role name is required").max(100, "Role name must be at most 100 characters"),
    /** Required: Unique key (e.g. ADMIN, USER). Uppercase, numbers, underscores only. */
    key: z.string().trim().min(1, "Role key is required").max(50).regex(/^[A-Z0-9_]+$/, "Key must be uppercase letters, numbers, and underscores"),
    /** Optional: Role description. */
    description: z.string().trim().max(500).optional(),
    /** Optional: Permission IDs. */
    permissionIds: z.array(z.string().trim().min(1)).max(100).optional(),
  }),
});

export const roleUpdateSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Role ID is required"),
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    permissionIds: z.array(z.string().trim().min(1)).max(100).optional(),
  }),
});
