import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Static-ish lookup data (regions, crops) used to populate dropdowns/filters
// across the app. Cheap enough to not need caching at this scale.
export const referenceRouter = Router();

referenceRouter.get(
  '/regions',
  asyncHandler(async (_req, res) => {
    const regions = await prisma.region.findMany({ orderBy: { name: 'asc' } });
    res.json({ regions });
  }),
);

referenceRouter.get(
  '/crops',
  asyncHandler(async (_req, res) => {
    const crops = await prisma.crop.findMany({ orderBy: { name: 'asc' } });
    res.json({ crops });
  }),
);
