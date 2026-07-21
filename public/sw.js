// Hand-written service worker (no Workbox) — covers the app SHELL only.
// Application DATA (listings, advice, transactions, feedback) is handled by
// the IndexedDB cache + outbox in lib/offline/, not here. This worker's only
// job is making sure the HTML/JS/CSS/fonts/icons are available offline so a
// hard reload doesn't hit the browser's native "no internet" page.

const CACHE_VERSION = 'batanai-shell-v1'
// Every route is precached directly (not just discovered at runtime): auth
// here is gated client-side after hydration (see components/app-shell.tsx),
// so the server returns the same shell HTML for these regardless of login
// state — the protected data underneath comes from the API, which this
// worker never caches. Client-side <Link> transitions fetch RSC payloads
// under these same pathnames (with a distinguishing query string), which
// never populates a plain navigation cache entry — so without precaching
// these explicitly, a hard reload on a route only ever reached by internal
// navigation would silently fall back to the wrong page.
const PRECACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/marketplace',
  '/decision-support',
  '/settings',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle same-origin GET requests. Cross-origin (the API server) and
  // any non-GET request pass straight through untouched — mutations and
  // data fetches are owned entirely by lib/api.ts + the offline outbox.
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || /\.(png|jpg|jpeg|svg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const fresh = await fetch(request)
    cache.put(request, fresh.clone())
    return fresh
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  cache.put(request, fresh.clone())
  return fresh
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((fresh) => {
      cache.put(request, fresh.clone())
      return fresh
    })
    .catch(() => cached)
  return cached || network
}
