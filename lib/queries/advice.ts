import { apiFetch, ApiError, NetworkUnavailableError } from '../api'
import { cacheOne, getOneCached } from '../offline/db'

export type Season = 'rainy' | 'dry_winter'

export type AdviceRule = {
  crop: string
  region: string
  season: Season
  planting: string
  watering: string
  fertilizer: string
  pest: string
}

function cacheKey(crop: string, region: string, season: Season) {
  return `${crop.toLowerCase()}|${region.toLowerCase()}|${season}`
}

/** Returns the rule, or null if there genuinely is no guidance for that
 * combination (a real, expected outcome — not an error). */
export async function getAdvice(crop: string, region: string, season: Season): Promise<AdviceRule | null> {
  const key = cacheKey(crop, region, season)
  try {
    const params = new URLSearchParams({ crop, region, season })
    const rule = await apiFetch<AdviceRule>(`/api/advice?${params}`)
    await cacheOne('adviceRules', { id: key, ...rule })
    return rule
  } catch (err) {
    if (err instanceof NetworkUnavailableError) {
      const cached = await getOneCached('adviceRules', key)
      return cached ?? null
    }
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}
