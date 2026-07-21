import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from './errorHandler.js';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

// Validates and REPLACES req.body/query/params with the parsed (and
// coerced/defaulted) result, so every downstream handler only ever sees
// data that has already passed validation — never trust client input past
// this point.
export function validate({ body, query, params }: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (query) req.query = query.parse(req.query);
      if (params) req.params = params.parse(req.params);
      next();
    } catch (err: any) {
      const message = err?.issues?.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ') ?? 'Invalid request';
      throw new HttpError(400, message);
    }
  };
}
