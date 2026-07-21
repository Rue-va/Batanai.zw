import { apiFetch, NetworkUnavailableError } from '../api'
import { cacheAll, cacheOne, getAllCached, enqueueMutation } from '../offline/db'
import type { SessionUser } from '../auth'

export type Listing = {
  id: string
  farmerId: string
  crop: string
  grade: string | null
  quantity: string
  unit: string
  price: string
  marketPrice: string | null
  regionId: string | null
  photoUrl: string | null
  status: 'active' | 'sold_out' | 'archived'
  views: number
  createdAt: string
  farmer?: { id: string; name: string; farmName: string | null; rating: string | null; verified: boolean }
  _pendingSync?: boolean
}

export async function getListings(filters: { q?: string; regionId?: string; status?: string } = {}): Promise<Listing[]> {
  try {
    const params = new URLSearchParams(filters as Record<string, string>)
    const data = await apiFetch<{ listings: Listing[] }>(`/api/listings?${params}`)
    await cacheAll('listings', data.listings)
    return data.listings
  } catch (err) {
    if (err instanceof NetworkUnavailableError) return getAllCached('listings')
    throw err
  }
}

export async function getMyListings(): Promise<Listing[]> {
  try {
    const data = await apiFetch<{ listings: Listing[] }>('/api/listings/mine')
    await cacheAll('listings', data.listings)
    return data.listings
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      const all = await getAllCached('listings')
      return all
    }
    throw err
  }
}

export type CreateListingInput = {
  crop: string
  grade?: string
  quantity: string
  unit: string
  price: number
  marketPrice?: number
  regionId?: string
  photoUrl?: string
}

/** Optimistic create: writes a local copy immediately (with a client-minted
 * id) so the UI updates instantly, then either lands it on the server right
 * away or queues it for the next sync if there's no connectivity. */
export async function createListing(input: CreateListingInput, farmer: SessionUser): Promise<Listing> {
  const id = crypto.randomUUID()
  const optimistic: Listing = {
    id,
    farmerId: farmer.id,
    crop: input.crop,
    grade: input.grade ?? null,
    quantity: input.quantity,
    unit: input.unit,
    price: String(input.price),
    marketPrice: input.marketPrice != null ? String(input.marketPrice) : null,
    regionId: input.regionId ?? null,
    photoUrl: input.photoUrl ?? null,
    status: 'active',
    views: 0,
    createdAt: new Date().toISOString(),
    farmer: { id: farmer.id, name: farmer.name, farmName: farmer.farmName, rating: farmer.rating, verified: farmer.verified },
    _pendingSync: true,
  }
  await cacheOne('listings', optimistic)

  try {
    const data = await apiFetch<{ listing: Listing }>('/api/listings', { method: 'POST', body: { id, ...input } })
    const synced = { ...data.listing, farmer: optimistic.farmer }
    await cacheOne('listings', synced)
    return synced
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      await enqueueMutation({
        id: crypto.randomUUID(),
        method: 'POST',
        path: '/api/listings',
        body: { id, ...input },
        createdAt: new Date().toISOString(),
        label: `New listing: ${input.crop}`,
      })
      return optimistic
    }
    throw err
  }
}
