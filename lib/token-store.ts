// Isolated so both lib/api.ts and lib/auth.ts can read/write the access
// token without importing each other (auth.ts calls the API to log in; the
// API client needs the token auth.ts manages — this breaks that cycle).
// The access token is short-lived (15 min) by design; the refresh token
// never touches JS at all — it's an httpOnly cookie the browser manages.

const ACCESS_TOKEN_KEY = 'batanai.access_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}
