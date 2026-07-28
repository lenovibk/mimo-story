import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Express 4 doesn't forward rejected promises from async handlers to error middleware on its own. */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
