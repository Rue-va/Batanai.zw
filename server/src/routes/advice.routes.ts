import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// The rule-based decision-support lookup: (crop, region, season) -> guidance
// text. This is a plain table lookup, not a model — there is no scoring or
// inference here by design.
export const adviceRouter = Router();

const lookupSchema = z.object({
  crop: z.string().trim().min(1),
  region: z.string().trim().min(1),
  season: z.enum(['rainy', 'dry_winter']),
});

adviceRouter.get(
  '/',
  validate({ query: lookupSchema }),
  asyncHandler(async (req, res) => {
    const { crop, region, season } = req.query as unknown as z.infer<typeof lookupSchema>;

    const rule = await prisma.adviceRule.findFirst({
      where: {
        season,
        crop: { name: { equals: crop, mode: 'insensitive' } },
        region: { name: { equals: region, mode: 'insensitive' } },
      },
      include: { crop: true, region: true },
    });

    if (!rule) {
      res.status(404).json({ error: 'No guidance yet for that crop/region/season combination.' });
      return;
    }

    res.json({
      crop: rule.crop.name,
      region: rule.region.name,
      season: rule.season,
      planting: rule.planting,
      watering: rule.watering,
      fertilizer: rule.fertilizer,
      pest: rule.pest,
    });
  }),
);
