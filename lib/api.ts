import { getAccessToken, setAccessToken, clearAccessToken } from './token-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// True when the request never reached the server at all (offline, DNS
// failure, etc.) — callers use this to decide whether to fall back to the
// local cache/outbox instead of surfacing an error.
export class NetworkUnavailableError extends Error {}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
        if (!res.ok) return false
        const data = await res.json()
        setAccessToken(data.accessToken)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  skipAuthRetry?: boolean
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuthRetry } = options
  const token = getAccessToken()

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new NetworkUnavailableError(`Could not reach the server for ${method} ${path}`)
  }

  if (res.status === 401 && !skipAuthRetry && path !== '/api/auth/refresh') {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipAuthRetry: true })
    }
    clearAccessToken()
  }

  if (res.status === 204) return undefined as T

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    const message = isJson && data && typeof data === 'object' && 'error' in data ? String((data as any).error) : 'Request failed'
    throw new ApiError(res.status, message)
  }

  return data as T
}
