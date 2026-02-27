import { z } from "zod";

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.string().min(1)
  }),
  params: z.object({
    id: z.string().min(1)
  })
});

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.string().min(1, "Role is required"),
    departmentId: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.string().min(1).optional(),
    departmentId: z.string().nullable().optional(),
  }),
  params: z.object({
    id: z.string().min(1)
  })
});
