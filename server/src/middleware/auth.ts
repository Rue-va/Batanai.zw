import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler.js';
import { verifyAccessToken, type AccessTokenPayload } from '../utils/tokens.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Authentication required');
  }
  const token = header.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, 'Invalid or expired access token');
  }
}

export function requireRole(...roles: Array<'farmer' | 'buyer' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'Not allowed for this account type');
    }
    next();
  };
}

/** Populates req.user when a valid token is present, but never rejects the
 * request — for routes that stay public (browsing listings) but behave
 * differently for a logged-in caller (e.g. distance sort from their own
 * saved location). */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice('Bearer '.length));
    } catch {
      // Invalid/expired token on an optional-auth route — proceed as anonymous.
    }
  }
  next();
}
