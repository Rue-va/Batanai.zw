/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Default position (bottom-left) overlaps the bottom-anchored "Get Started"
  // button and the bottom nav bar, silently eating taps in dev mode on
  // mobile viewports. Moving it clear of every bottom-anchored control.
  devIndicators: {
    position: 'top-left',
  },
  // Without this, `next dev` silently restricts cross-origin dev requests
  // (HMR/RSC) when the app is opened via a LAN IP instead of localhost —
  // the page loads but client-side interactivity never finishes wiring up,
  // with no console error to point at. Needed for testing on a real phone
  // against the dev server. Not used in production builds.
  allowedDevOrigins: ['192.168.1.199'],
  // A service worker registered before dev-mode was made to skip
  // registration (see components/service-worker-registration.tsx) can keep
  // controlling the page and serving its OWN cached (stale) JS — including
  // the very code that's supposed to unregister it. That's a chicken-and-egg
  // problem no client-side JS fix can reliably escape. Clear-Site-Data forces
  // the browser itself to drop the service worker and HTTP cache for this
  // origin before any page script runs, so it can't be sidestepped by stale
  // cached JS. Deliberately NOT clearing "storage" — that would also wipe
  // localStorage (session, onboarding, offline queue) on every request,
  // logging you out constantly. Dev only — never sent in production.
  async headers() {
    if (process.env.NODE_ENV === 'production') return []
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Clear-Site-Data', value: '"cache", "serviceWorkers"' }],
      },
    ]
  },
}

export default nextConfig
