import rateLimit from 'express-rate-limit';

// Auth endpoints are the brute-force target: cap attempts per IP, keyed
// separately from the general API limiter below.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

// A looser general limiter for the rest of the API, mainly to blunt abuse
// rather than to shape normal traffic.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
