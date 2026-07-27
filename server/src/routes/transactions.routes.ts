import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

export const transactionsRouter = Router();

// Server-authoritative state machine — mirrors the frontend's nextStatus
// map, but the frontend's copy is only a UI hint. This is the version that
// actually gets enforced, since client-side state can't be trusted.
const NEXT_STATUS: Record<string, string | undefined> = {
  Interested: 'Negotiating',
  Negotiating: 'Agreed',
  Agreed: 'Completed',
};

transactionsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;
    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ farmerId: userId }, { buyerId: userId }] },
      include: {
        listing: true,
        farmer: { select: { id: true, name: true, farmName: true } },
        buyer: { select: { id: true, name: true, farmName: true } },
        rating: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ transactions });
  }),
);

const createTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  listingId: z.string().uuid(),
  quantity: z.string().trim().min(1).max(40),
  totalPrice: z.number().positive(),
});

// Buyers "express interest" — this is what creates the transaction.
transactionsRouter.post(
  '/',
  requireAuth,
  requireRole('buyer'),
  validate({ body: createTransactionSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof createTransactionSchema>;

    if (data.id) {
      const existing = await prisma.transaction.findUnique({ where: { id: data.id } });
      if (existing) {
        res.status(200).json({ transaction: existing });
        return;
      }
    }

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
    if (!listing) throw new HttpError(404, 'Listing not found');

    const transaction = await prisma.transaction.create({
      data: {
        id: data.id,
        listingId: data.listingId,
        farmerId: listing.farmerId,
        buyerId: req.user!.sub,
        quantity: data.quantity,
        totalPrice: data.totalPrice,
      },
    });
    res.status(201).json({ transaction });
  }),
);

const advanceSchema = z.object({
  status: z.enum(['Negotiating', 'Agreed', 'Completed']),
});

transactionsRouter.patch(
  '/:id/advance',
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }), body: advanceSchema }),
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!transaction) throw new HttpError(404, 'Transaction not found');

    const userId = req.user!.sub;
    if (transaction.farmerId !== userId && transaction.buyerId !== userId) {
      throw new HttpError(403, 'Not your transaction');
    }

    const { status: requested } = req.body as z.infer<typeof advanceSchema>;
    const allowedNext = NEXT_STATUS[transaction.status];
    if (requested !== allowedNext) {
      throw new HttpError(400, `Cannot move from ${transaction.status} to ${requested}`);
    }

    const updated = await prisma.transaction.update({ where: { id: req.params.id }, data: { status: requested as any } });
    res.json({ transaction: updated });
  }),
);

const rateSchema = z.object({
  value: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

// Buyer rates the farmer once a trade is Completed — the only path that
// ever creates a Rating row. One per transaction (enforced by the unique
// constraint on Rating.transactionId as well as the check below).
transactionsRouter.post(
  '/:id/rating',
  requireAuth,
  requireRole('buyer'),
  validate({ params: z.object({ id: z.string().uuid() }), body: rateSchema }),
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!transaction) throw new HttpError(404, 'Transaction not found');
    if (transaction.buyerId !== req.user!.sub) throw new HttpError(403, 'Not your transaction');
    if (transaction.status !== 'Completed') throw new HttpError(400, 'Can only rate a completed transaction');

    const existing = await prisma.rating.findUnique({ where: { transactionId: transaction.id } });
    if (existing) throw new HttpError(409, 'This transaction has already been rated');

    const { value, comment } = req.body as z.infer<typeof rateSchema>;

    const rating = await prisma.$transaction(async (tx) => {
      const created = await tx.rating.create({
        data: { transactionId: transaction.id, fromUserId: req.user!.sub, toUserId: transaction.farmerId, value, comment },
      });

      // Recompute the farmer's aggregate rating from every rating they've
      // received, rather than incrementally averaging — simpler to reason
      // about and self-corrects if a rating is ever removed later.
      const agg = await tx.rating.aggregate({
        where: { toUserId: transaction.farmerId },
        _avg: { value: true },
        _count: true,
      });
      await tx.user.update({
        where: { id: transaction.farmerId },
        data: { rating: agg._avg.value, reviewCount: agg._count },
      });

      return created;
    });

    res.status(201).json({ rating });
  }),
);

// Decline: only valid while still in the initial "Interested" state.
transactionsRouter.delete(
  '/:id',
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({ where: { id: req.params.id } });
    if (!transaction) throw new HttpError(404, 'Transaction not found');

    const userId = req.user!.sub;
    if (transaction.farmerId !== userId && transaction.buyerId !== userId) {
      throw new HttpError(403, 'Not your transaction');
    }
    if (transaction.status !== 'Interested') {
      throw new HttpError(400, 'Can only decline a transaction that is still Interested');
    }

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
