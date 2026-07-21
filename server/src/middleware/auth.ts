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

export function requireRole(...roles: Array<'farmer' | 'buyer'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(403, 'Not allowed for this account type');
    }
    next();
  };
}
