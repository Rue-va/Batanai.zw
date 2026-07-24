import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Comma-separated list of allowed origins (e.g. testing from both
  // localhost and a phone over LAN IP at once). Split first, then validate
  // each entry individually — the cors package matches one exact origin at
  // a time, so this becomes an array the request handler checks against,
  // not a literal string compared as a whole.
  CORS_ORIGIN: z
    .string()
    .min(1, 'CORS_ORIGIN is required')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .refine(
      (origins) => origins.every((o) => o.startsWith('http://') || o.startsWith('https://')),
      'Every origin in CORS_ORIGIN must include the scheme, e.g. https://your-app.vercel.app — browsers match Access-Control-Allow-Origin against the full origin, so a bare hostname never matches and every request silently fails CORS',
    )
    .refine(
      (origins) => origins.every((o) => !o.endsWith('/')),
      'No origin in CORS_ORIGIN may have a trailing slash',
    ),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  ADMIN_EXPORT_TOKEN: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables — check .env against .env.example');
}

export const env = parsed.data;
