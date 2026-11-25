import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

// Section addresses (/about, /contact …) are the same page as "/", so only real pages are listed.
// Bump these dates when the page content changes.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: new Date('2026-11-25'), changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/privacy`, lastModified: new Date('2026-11-25'), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
