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
}

export default nextConfig
