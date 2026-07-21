'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

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
