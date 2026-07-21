'use client'

// Real API-backed auth. getSession() stays synchronous (reads a locally
// cached copy of the last-known user) so existing components that read it
// inside useEffect don't need to change — the cache is kept fresh by
// register/login/refreshSession, all of which write through to it.

import { apiFetch, ApiError } from './api'
import { getAccessToken, setAccessToken, clearAccessToken } from './token-store'

export type Role = 'farmer' | 'buyer'

export type SessionUser = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  farmName: string | null
  regionId: string | null
  languagePref: 'en' | 'sh'
  rating: string | null
  reviewCount: number
  verified: boolean
  certifications: string[]
  createdAt: string
}

const USER_KEY = 'batanai.user'
const ONBOARDED_KEY = 'batanai.onboarded'

function cacheUser(user: SessionUser) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null
  if (!getAccessToken()) return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as SessionUser) : null
  } catch {
    return null
  }
}

export function clearSession() {
  clearAccessToken()
  window.localStorage.removeItem(USER_KEY)
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(ONBOARDED_KEY) === 'true'
}

export function setOnboarded() {
  window.localStorage.setItem(ONBOARDED_KEY, 'true')
}

const CONSENT_KEY = 'batanai.research_consent'

export function hasResearchConsent(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CONSENT_KEY) === 'true'
}

export function setResearchConsent() {
  window.localStorage.setItem(CONSENT_KEY, 'true')
}

export function clearResearchConsent() {
  window.localStorage.removeItem(CONSENT_KEY)
}

export type RegisterInput = {
  name: string
  password: string
  role: Role
  email?: string
  phone?: string
  farmName?: string
  languagePref?: 'en' | 'sh'
}

export async function register(input: RegisterInput): Promise<SessionUser> {
  const data = await apiFetch<{ accessToken: string; user: SessionUser }>('/api/auth/register', {
    method: 'POST',
    body: input,
  })
  setAccessToken(data.accessToken)
  cacheUser(data.user)
  return data.user
}

export type LoginInput = { email?: string; phone?: string; password: string }

export async function login(input: LoginInput): Promise<SessionUser> {
  const data = await apiFetch<{ accessToken: string; user: SessionUser }>('/api/auth/login', {
    method: 'POST',
    body: input,
  })
  setAccessToken(data.accessToken)
  cacheUser(data.user)
  return data.user
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Best-effort: even if the request fails (offline, etc.), clear local
    // state so the device forgets the session.
  }
  clearSession()
}

/** Revalidates the cached session against the server. Call on app boot —
 * catches the case where a refresh token was revoked/expired elsewhere. */
export async function refreshSession(): Promise<SessionUser | null> {
  if (!getAccessToken()) return null
  try {
    const data = await apiFetch<{ user: SessionUser }>('/api/auth/me')
    cacheUser(data.user)
    return data.user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      clearSession()
      return null
    }
    // Network error while offline — keep the cached session as-is rather
    // than logging the user out just because they lost signal.
    return getSession()
  }
}

export type UpdateProfileInput = { name?: string; farmName?: string; role?: Role; languagePref?: 'en' | 'sh' }

export async function updateProfile(input: UpdateProfileInput): Promise<SessionUser> {
  const data = await apiFetch<{ user: SessionUser }>('/api/auth/me/update', { method: 'PATCH', body: input })
  cacheUser(data.user)
  return data.user
}
