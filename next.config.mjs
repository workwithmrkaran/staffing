/** Home page sections that also have their own clean address, e.g. /about, /contact. Keep in sync with lib/site.ts. */
const SECTIONS = ['about', 'services', 'industries', 'methodology', 'leadership', 'contact']

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // /about, /services … show the home page; the page then scrolls to that section.
  async rewrites() {
    return SECTIONS.map((section) => ({ source: `/${section}`, destination: '/' }))
  },
}

export default nextConfig
