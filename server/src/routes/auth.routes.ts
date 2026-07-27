import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} from '../utils/tokens.js';
import { toPublicUser } from '../utils/publicUser.js';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;

const REFRESH_COOKIE = 'batanai_refresh';
const isProd = env.NODE_ENV === 'production';

function setRefreshCookie(res: import('express').Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: expiresAt,
    path: '/api/auth',
  });
}

async function issueSession(userId: string) {
  const refreshToken = generateRefreshToken();
  const expiresAt = refreshExpiryDate();
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  });
  return { refreshToken, expiresAt };
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    password: z.string().min(8).max(200),
    role: z.enum(['farmer', 'buyer']),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    farmName: z.string().trim().min(1).max(150).optional(),
    regionId: z.string().uuid().optional(),
    languagePref: z.enum(['en', 'sh']).default('en'),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Provide an email or phone number',
    path: ['email'],
  });

authRouter.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { name, password, role, email, phone, farmName, regionId, languagePref } = req.body as z.infer<
      typeof registerSchema
    >;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new HttpError(409, 'An account with this email already exists');
    }
    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) throw new HttpError(409, 'An account with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, passwordHash, role, email, phone, farmName, regionId, languagePref, lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { refreshToken, expiresAt } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken, expiresAt);

    res.status(201).json({ accessToken, user: toPublicUser(user) });
  }),
);

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    password: z.string().min(1),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Provide an email or phone number',
    path: ['email'],
  });

authRouter.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body as z.infer<typeof loginSchema>;

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findUnique({ where: { phone: phone! } });

    // Deliberately identical error for "no such account" and "wrong
    // password" — do not let an attacker enumerate which emails/phones
    // have accounts.
    if (!user) throw new HttpError(401, 'Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Invalid credentials');

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { refreshToken, expiresAt } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken, expiresAt);

    res.json({ accessToken, user: toPublicUser({ ...user, lastLoginAt: new Date() }) });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new HttpError(401, 'No refresh token');

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new HttpError(401, 'Refresh token is invalid or expired');
    }

    // Rotate on every use: revoke the old token and issue a new one, so a
    // stolen-but-unused token can only be replayed once before the
    // legitimate user's next refresh invalidates it.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new HttpError(401, 'Account no longer exists');

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { refreshToken, expiresAt } = await issueSession(user.id);
    setRefreshCookie(res, refreshToken, expiresAt);

    res.json({ accessToken, user: toPublicUser(user) });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw new HttpError(404, 'Account no longer exists');
    res.json({ user: toPublicUser(user) });
  }),
);

// role is deliberately not accepted here — a user's role is fixed at signup.
// Changing it is an admin-only action performed via direct DB update (or a
// seed script), never through a self-service API call.
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  farmName: z.string().trim().min(1).max(150).optional(),
  languagePref: z.enum(['en', 'sh']).optional(),
});

authRouter.patch(
  '/me/update',
  requireAuth,
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.user!.sub }, data: req.body });
    res.json({ user: toPublicUser(user) });
  }),
);

// A one-time-or-occasionally-updated location, not continuous tracking —
// the caller sets this explicitly (Geolocation API, with the browser's own
// permission prompt) or types a region/town manually. Either is accepted on
// its own; latitude/longitude are precise and only ever used server-side
// for distance sorting (see listings.routes.ts) — they are never returned
// to other users, only locationLabel is.
const updateLocationSchema = z
  .object({
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    locationLabel: z.string().trim().min(1).max(120).optional(),
  })
  .refine((data) => data.locationLabel !== undefined || (data.latitude !== undefined && data.longitude !== undefined), {
    message: 'Provide a locationLabel, or both latitude and longitude',
  });

authRouter.patch(
  '/me/location',
  requireAuth,
  validate({ body: updateLocationSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({ where: { id: req.user!.sub }, data: req.body });
    res.json({ user: toPublicUser(user) });
  }),
);
