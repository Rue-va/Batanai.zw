import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Centralized error handler — this is the ONLY place that should format an
// error response. Every route handler passes errors to next(err) instead of
// building its own response, so this contract can't be bypassed.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Full detail (stack trace, raw message) goes to the server log only.
  console.error(`[${req.method} ${req.path}]`, err);

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // Unknown/unexpected errors: never leak internals to the client.
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// Wraps an async route handler so a rejected promise reaches errorHandler
// instead of crashing the process or hanging the request.
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
