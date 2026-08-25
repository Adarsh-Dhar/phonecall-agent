import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express handler with error handling.
 * Catches any errors and responds with a 500 status and the provided error message.
 * Note: This wrapper only catches errors thrown from the async function,
 * not early returns like res.status(400).json(...).
 */
export function asyncHandler(fn: RequestHandler, errorMsg: string): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      res.status(500).json({ error: errorMsg });
    }
  };
}
