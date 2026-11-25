import type { MetadataRoute } from 'next'
import { INDEXABLE, SITE } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  // Not on the real domain yet (see INDEXABLE in lib/site.ts): keep all search engines out.
  if (!INDEXABLE) return { rules: [{ userAgent: '*', disallow: '/' }] }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
