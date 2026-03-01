import { z } from "zod";

export const idParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Department ID is required"),
  }),
});

export const departmentCreateSchema = z.object({
  body: z.object({
    /** Required: Department name. */
    name: z.string().trim().min(1, "Department name is required").max(100, "Department name must be at most 100 characters"),
    /** Optional: Role IDs assigned to department. */
    roleIds: z.array(z.string().trim().min(1)).max(50).optional(),
  }),
});

export const departmentUpdateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    roleIds: z.array(z.string().trim().min(1)).max(50).optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1, "Department ID is required"),
  }),
});
