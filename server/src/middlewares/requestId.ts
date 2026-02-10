import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

const HEADER_REQUEST_ID = "x-request-id";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = (req.get(HEADER_REQUEST_ID) as string) || randomUUID();
  req.requestId = id;
  res.setHeader(HEADER_REQUEST_ID, id);
  next();
}
