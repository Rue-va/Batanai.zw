'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Never run a service worker in development. Turbopack/webpack chunk
    // filenames change on every dev-server restart, but a cached page shell
    // keeps referencing the old ones — the browser then requests a chunk
    // that no longer exists on the server ("ChunkLoadError ... review your
    // service worker configuration"). SWs are a production reliability
    // feature; in dev they only fight Fast Refresh. Actively unregister and
    // clear caches here too, so a machine that already registered one
    // during earlier testing (e.g. before this fix) self-heals on next load
    // instead of needing a manual "clear site data".
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister()
      })
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
      }
      return
    }

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err)
    })

    // The worker calls skipWaiting()/clients.claim() itself, so a new
    // version takes control almost immediately — reload once when that
    // happens so the page actually picks up the fresh assets instead of
    // running old JS against a newly-activated worker.
    let reloaded = false
    function onControllerChange() {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  return null
}
