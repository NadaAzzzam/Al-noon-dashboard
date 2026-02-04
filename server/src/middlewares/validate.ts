import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  schema.parse({
    body: req.body,
    params: req.params,
    query: req.query
  });
  next();
};
