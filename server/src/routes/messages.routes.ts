import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';

export const messagesRouter = Router();

messagesRouter.get(
  '/',
  requireAuth,
  validate({ query: z.object({ listingId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const { listingId } = req.query as unknown as { listingId: string };
    const userId = req.user!.sub;

    const messages = await prisma.message.findMany({
      where: { listingId, OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { sentAt: 'asc' },
    });
    res.json({ messages });
  }),
);

const createMessageSchema = z.object({
  id: z.string().uuid().optional(),
  listingId: z.string().uuid(),
  receiverId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

messagesRouter.post(
  '/',
  requireAuth,
  validate({ body: createMessageSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof createMessageSchema>;
    const senderId = req.user!.sub;

    if (data.id) {
      const existing = await prisma.message.findUnique({ where: { id: data.id } });
      if (existing) {
        res.status(200).json({ message: existing });
        return;
      }
    }

    const listing = await prisma.listing.findUnique({ where: { id: data.listingId } });
    if (!listing) throw new HttpError(404, 'Listing not found');

    const message = await prisma.message.create({
      data: { id: data.id, listingId: data.listingId, senderId, receiverId: data.receiverId, body: data.body },
    });
    res.status(201).json({ message });
  }),
);

messagesRouter.patch(
  '/:id/read',
  requireAuth,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const message = await prisma.message.findUnique({ where: { id: req.params.id } });
    if (!message) throw new HttpError(404, 'Message not found');
    if (message.receiverId !== req.user!.sub) throw new HttpError(403, 'Not your message to mark read');

    const updated = await prisma.message.update({ where: { id: req.params.id }, data: { readAt: new Date() } });
    res.json({ message: updated });
  }),
);
