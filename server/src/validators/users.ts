import { z } from "zod";

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "User ID is required")
  })
});

export const updateRoleSchema = z.object({
  body: z.object({
    /** Required: Role ID or key. */
    role: z.string().trim().min(1, "Role is required")
  }),
  params: z.object({
    id: z.string().trim().min(1, "User ID is required")
  })
});

export const createUserSchema = z.object({
  body: z.object({
    /** Required: Full name. */
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
    /** Required: Valid email. */
    email: z.string().trim().toLowerCase().email("Invalid email"),
    /** Required: Password (min 6 chars). */
    password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters"),
    /** Required: Role ID or key. */
    role: z.string().trim().min(1, "Role is required"),
    /** Optional: Department ID. */
    departmentId: z.string().trim().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    password: z.string().min(6).max(128).optional(),
    role: z.string().trim().min(1).optional(),
    departmentId: z.string().nullable().optional(),
  }),
  params: z.object({
    id: z.string().trim().min(1, "User ID is required")
  })
});

const passwordMin = z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters");

export const updateCustomerPasswordSchema = z.object({
  body: z
    .object({
      newPassword: passwordMin,
      confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
  params: z.object({
    id: z.string().trim().min(1, "Customer ID is required"),
  }),
});
