import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { haversineKm } from '../utils/distance.js';

export const listingsRouter = Router();

// locationLabel (a town/district string) is the only location detail ever
// exposed here — precise latitude/longitude belong to the farmer's account
// and are never selected into a buyer-facing response. See distance-sort
// below, which computes with the raw values server-side and returns only
// the resulting distance, not the coordinates themselves.
const PUBLIC_FARMER_SELECT = { id: true, name: true, farmName: true, rating: true, verified: true, locationLabel: true } as const;

const browseQuerySchema = z.object({
  q: z.string().trim().optional(),
  regionId: z.string().uuid().optional(),
  status: z.enum(['active', 'sold_out', 'archived']).default('active'),
  sort: z.enum(['distance']).optional(),
});

listingsRouter.get(
  '/',
  optionalAuth,
  validate({ query: browseQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, regionId, status, sort } = req.query as unknown as z.infer<typeof browseQuerySchema>;

    let origin: { latitude: number; longitude: number } | null = null;
    if (sort === 'distance') {
      if (!req.user) throw new HttpError(401, 'Sign in to sort by distance from your location');
      const me = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { latitude: true, longitude: true } });
      if (!me?.latitude || !me?.longitude) {
        throw new HttpError(400, 'Set your location in your profile first to sort by distance');
      }
      origin = { latitude: Number(me.latitude), longitude: Number(me.longitude) };
    }

    const listings = await prisma.listing.findMany({
      where: {
        status,
        regionId: regionId ?? undefined,
        ...(q
          ? {
              OR: [
                { crop: { contains: q, mode: 'insensitive' } },
                { farmer: { name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { farmer: { select: { ...PUBLIC_FARMER_SELECT, latitude: true, longitude: true } }, region: true },
      orderBy: { createdAt: 'desc' },
    });

    // Distance is computed here (using the farmer's coords fetched above
    // for the calculation) and then stripped back out before responding —
    // origin's own coordinates, and every farmer's, stay server-side only.
    let withDistance = listings.map((l) => ({
      ...l,
      distanceKm:
        origin && l.farmer.latitude != null && l.farmer.longitude != null
          ? haversineKm(origin.latitude, origin.longitude, Number(l.farmer.latitude), Number(l.farmer.longitude))
          : null,
    }));
    if (sort === 'distance') {
      withDistance = withDistance
        .filter((l) => l.distanceKm != null)
        .sort((a, b) => a.distanceKm! - b.distanceKm!);
    }
    const sanitized = withDistance.map((l) => ({
      ...l,
      farmer: { ...l.farmer, latitude: undefined, longitude: undefined },
    }));

    res.json({ listings: sanitized });
  }),
);

listingsRouter.get(
  '/mine',
  requireAuth,
  requireRole('farmer'),
  asyncHandler(async (req, res) => {
    const listings = await prisma.listing.findMany({
      where: { farmerId: req.user!.sub },
      include: { region: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ listings });
  }),
);

listingsRouter.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: { farmer: { select: PUBLIC_FARMER_SELECT }, region: true },
    });
    if (!listing) throw new HttpError(404, 'Listing not found');
    res.json({ listing });
  }),
);

const createListingSchema = z.object({
  // Client-generated UUID from the offline sync queue. Optional so direct
  // API consumers don't have to mint one; when present, retries of the same
  // create are idempotent instead of erroring on a duplicate key.
  id: z.string().uuid().optional(),
  crop: z.string().trim().min(1).max(80),
  grade: z.string().trim().max(10).optional(),
  quantity: z.string().trim().min(1).max(40),
  unit: z.string().trim().min(1).max(20),
  price: z.number().positive(),
  marketPrice: z.number().positive().optional(),
  regionId: z.string().uuid().optional(),
  photoUrl: z.string().url().optional(),
});

listingsRouter.post(
  '/',
  requireAuth,
  requireRole('farmer'),
  validate({ body: createListingSchema }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof createListingSchema>;

    if (data.id) {
      const existing = await prisma.listing.findUnique({ where: { id: data.id } });
      if (existing) {
        if (existing.farmerId !== req.user!.sub) throw new HttpError(409, 'Listing id already in use');
        res.status(200).json({ listing: existing });
        return;
      }
    }

    const listing = await prisma.listing.create({
      data: { ...data, farmerId: req.user!.sub },
    });
    res.status(201).json({ listing });
  }),
);

const updateListingSchema = z.object({
  crop: z.string().trim().min(1).max(80).optional(),
  grade: z.string().trim().max(10).optional(),
  quantity: z.string().trim().min(1).max(40).optional(),
  unit: z.string().trim().min(1).max(20).optional(),
  price: z.number().positive().optional(),
  marketPrice: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
  status: z.enum(['active', 'sold_out', 'archived']).optional(),
});

listingsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  validate({ params: z.object({ id: z.string().uuid() }), body: updateListingSchema }),
  asyncHandler(async (req, res) => {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new HttpError(404, 'Listing not found');
    if (listing.farmerId !== req.user!.sub) throw new HttpError(403, 'Not your listing');

    const updated = await prisma.listing.update({ where: { id: req.params.id }, data: req.body });
    res.json({ listing: updated });
  }),
);

// Soft delete: archive rather than hard-delete, since transactions and
// messages reference this listing's history.
listingsRouter.delete(
  '/:id',
  requireAuth,
  requireRole('farmer'),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new HttpError(404, 'Listing not found');
    if (listing.farmerId !== req.user!.sub) throw new HttpError(403, 'Not your listing');

    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'archived' } });
    res.status(204).send();
  }),
);

listingsRouter.post(
  '/:id/view',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    await prisma.listing.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
    res.status(204).send();
  }),
);
