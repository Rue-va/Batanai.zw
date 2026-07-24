import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Comma-separated list of allowed origins (e.g. testing from both
  // localhost and a phone over LAN IP at once). Split first — the cors
  // package matches one exact origin at a time, so this becomes an array
  // the request handler checks against, not a literal string compared as a
  // whole. A missing scheme or trailing slash is auto-corrected (with a
  // loud warning) rather than rejected outright: a hard failure here only
  // surfaces in the host's deploy logs, which is easy to miss, and this
  // exact mistake (pasting a bare hostname) is unambiguous to fix safely.
  CORS_ORIGIN: z
    .string()
    .min(1, 'CORS_ORIGIN is required')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .map((o) => {
          let fixed = o;
          if (!/^https?:\/\//.test(fixed)) {
            console.warn(`[env] CORS_ORIGIN entry "${o}" has no scheme — assuming https://${fixed}`);
            fixed = `https://${fixed}`;
          }
          if (fixed.endsWith('/')) {
            fixed = fixed.slice(0, -1);
            console.warn(`[env] CORS_ORIGIN entry "${o}" had a trailing slash — using ${fixed}`);
          }
          return fixed;
        }),
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
