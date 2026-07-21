import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { env } from '../lib/env.js';

// Deliberately unauthenticated: feedback is tied to an anonymized
// participant_code generated client-side, never to a logged-in account, so
// requiring auth here would defeat the point.
export const feedbackRouter = Router();

const submitSchema = z.object({
  participantCode: z.string().trim().min(1).max(64),
  triggerContext: z.string().trim().min(1).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  consentGiven: z.boolean(),
});

feedbackRouter.post(
  '/',
  validate({ body: submitSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof submitSchema>;
    if (!data.consentGiven) {
      throw new HttpError(400, 'Feedback requires consent to be recorded');
    }
    const feedback = await prisma.feedback.create({ data });
    res.status(201).json({ feedback });
  }),
);

// Research-data export for the thesis evaluation chapter. There's no formal
// admin role in this app, so this is gated by a standalone export token
// (set in the environment, never committed) rather than a user JWT — keeps
// it decoupled from the anonymized-by-design feedback data it's exporting.
feedbackRouter.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const token = req.headers['x-export-token'];
    if (!env.ADMIN_EXPORT_TOKEN || token !== env.ADMIN_EXPORT_TOKEN) {
      throw new HttpError(401, 'Invalid export token');
    }

    const rows = await prisma.feedback.findMany({ orderBy: { createdAt: 'asc' } });
    const header = ['id', 'participant_code', 'trigger_context', 'rating', 'comment', 'consent_given', 'created_at'];
    const csvLines = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          r.participantCode,
          r.triggerContext,
          r.rating,
          `"${(r.comment ?? '').replace(/"/g, '""')}"`,
          r.consentGiven,
          r.createdAt.toISOString(),
        ].join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="batanai-feedback.csv"');
    res.send(csvLines.join('\n'));
  }),
);
