import { z } from "zod";

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["ADMIN", "USER"])
  }),
  params: z.object({
    id: z.string().min(1)
  })
});
