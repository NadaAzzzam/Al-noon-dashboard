import { z } from "zod";

export const idParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Department ID is required"),
  }),
});

export const departmentCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Department name is required").max(100),
    roleIds: z.array(z.string()).optional(),
  }),
});

export const departmentUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    roleIds: z.array(z.string()).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Department ID is required"),
  }),
});
