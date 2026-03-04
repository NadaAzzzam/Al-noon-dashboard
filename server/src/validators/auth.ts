import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    /** Required: Full name (min 2 chars). */
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
    /** Required: Valid email address. */
    email: z.string().trim().toLowerCase().email("Valid email is required"),
    /** Required: Password (min 6 chars for security). */
    password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters")
  })
});

export const loginSchema = z.object({
  body: z.object({
    /** Required: Email (or admin@localhost for dev). */
    email: z.union([z.string().trim().toLowerCase().email("Valid email is required"), z.literal("admin@localhost")]),
    /** Required: Password (min 6 chars). */
    password: z.string().min(6, "Password must be at least 6 characters"),
    /** When true, sets admin-only cookie (dashboard); when false/omitted, sets customer cookie (sitefront). */
    admin: z.boolean().optional()
  })
});

const passwordMin = z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be at most 128 characters");

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Valid email is required")
  })
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().trim().min(1, "Reset token is required"),
      password: passwordMin,
      confirmPassword: z.string().min(1, "Please confirm your password")
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    })
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordMin,
      confirmPassword: z.string().min(1, "Please confirm your new password")
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "New password and confirmation do not match",
      path: ["confirmPassword"]
    })
});
