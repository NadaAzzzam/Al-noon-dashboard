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
