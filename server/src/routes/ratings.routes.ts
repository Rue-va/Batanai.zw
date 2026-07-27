import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Scoped strictly to the caller's own subset — a farmer sees ratings THEY
// received, a buyer sees ratings THEY gave, never the platform-wide table
// (that's admin-only, see admin.routes.ts).
export const ratingsRouter = Router();

ratingsRouter.get(
  '/received',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ratings = await prisma.rating.findMany({
      where: { toUserId: req.user!.sub },
      include: { fromUser: { select: { id: true, name: true, farmName: true } }, transaction: { select: { id: true, listingId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ratings });
  }),
);

ratingsRouter.get(
  '/given',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ratings = await prisma.rating.findMany({
      where: { fromUserId: req.user!.sub },
      include: { toUser: { select: { id: true, name: true, farmName: true } }, transaction: { select: { id: true, listingId: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ratings });
  }),
);
