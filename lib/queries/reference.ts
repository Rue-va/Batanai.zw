import { apiFetch, NetworkUnavailableError } from '../api'
import { cacheAll, getAllCached } from '../offline/db'

export type Region = { id: string; name: string }
export type Crop = { id: string; name: string }

export async function getRegions(): Promise<Region[]> {
  try {
    const data = await apiFetch<{ regions: Region[] }>('/api/regions')
    await cacheAll('regions', data.regions)
    return data.regions
  } catch (err) {
    if (err instanceof NetworkUnavailableError) return getAllCached('regions')
    throw err
  }
}

export async function getCrops(): Promise<Crop[]> {
  try {
    const data = await apiFetch<{ crops: Crop[] }>('/api/crops')
    await cacheAll('crops', data.crops)
    return data.crops
  } catch (err) {
    if (err instanceof NetworkUnavailableError) return getAllCached('crops')
    throw err
  }
}
