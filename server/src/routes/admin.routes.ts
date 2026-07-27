import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Every route here is gated by requireRole('admin') — a non-admin gets a
// 403 straight from Express before any query runs, regardless of what the
// frontend does or doesn't show. There is deliberately no way to reach
// admin status through the API (see updateProfileSchema in auth.routes.ts,
// which only ever accepts 'farmer' | 'buyer') — promote via a direct
// database update or the seed script.
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        verified: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  }),
);

adminRouter.get(
  '/transactions',
  asyncHandler(async (_req, res) => {
    const transactions = await prisma.transaction.findMany({
      include: {
        listing: { select: { id: true, crop: true } },
        farmer: { select: { id: true, name: true, farmName: true } },
        buyer: { select: { id: true, name: true, farmName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ transactions });
  }),
);

adminRouter.get(
  '/ratings',
  asyncHandler(async (_req, res) => {
    const ratings = await prisma.rating.findMany({
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ratings });
  }),
);
