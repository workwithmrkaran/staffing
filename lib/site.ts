import type { HeroSlide } from '@/components/hero-slideshow'
// Shared business details used by pages, metadata and structured data.

export const SITE = {
  name: 'A3A Staffing Solutions',
  // Set NEXT_PUBLIC_SITE_URL to the live domain (e.g. https://www.a3astaffing.com) for correct canonical URLs and sitemap.
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  phone: '+91 98963 33317',
  phoneHref: 'tel:+919896333317',
  email: 'a3astaffingsolutions@gmail.com',
  logoUrl: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-10-23%20at%208.14.08%20PM-dUhun3ZSYwxGwyg7RWRAai4aHngtF0.jpeg',
  whatsappUrl: 'https://wa.me/919896333317?text=Hi%20A3A%20Staffing%2C%20I%20would%20like%20to%20discuss%20a%20hiring%20requirement.',
  linkedinUrl: 'https://linkedin.com/in/poojakh',
} as const

/** Unsplash CDN image (free Unsplash licence). Swap for your own photos any time. */
export function unsplash(id: string, width: number, height?: number): string {
  const size = height ? `&h=${height}&fit=crop` : ''
  return `https://images.unsplash.com/${id}?auto=format&q=70&w=${width}${size}`
}

/** Free-licence photo URL: Unsplash ids ("photo-...") or Pexels ids ("pexels-<number>"). */
export function photoUrl(id: string, width: number): string {
  if (id.startsWith('pexels-')) {
    const n = id.slice('pexels-'.length)
    return `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=${width}`
  }
  return unsplash(id, width)
}

export const PHOTOS = {
  heroTeamWin: { id: 'photo-1695891583421-3cbbf1c2e3bd', alt: 'Colleagues celebrating a successful hire with a high five at their desks' },
  teamCollab: { id: 'photo-1781246212288-7fa538344718', alt: 'Team of professionals collaborating around a conference table with laptops' },
  teamSmiling: { id: 'photo-1754531976828-69e42ce4e0d9', alt: 'Smiling team of mid-level professionals gathered around a laptop' },
  executive: { id: 'photo-1758518729459-235dcaadc611', alt: 'Senior executive in a blue suit smiling in a modern office' },
  interviewOffice: { id: 'photo-1686771416537-bf4a4f263d88', alt: 'Recruitment consultant interviewing a candidate across a desk' },
} as const

/** Hero slideshow. Slide 1 carries the main headline; the others show their own caption. */
export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    id: 'pexels-7643786',
    alt: 'Job interview at a table beside large office windows',
    position: 'object-[72%_center] lg:object-center',
    layout: 'split',
  },
  {
    id: 'photo-1758691737278-3af15b37af48',
    alt: 'Consultant and candidate in a one-on-one career conversation',
    position: 'object-[64%_center] sm:object-[80%_center] lg:object-[center_35%]',
    layout: 'full',
    caption: {
      eyebrow: 'For professionals',
      title: 'Career moves, guided by people who listen.',
      text: 'We match your goals and timing with the right opportunity.',
      cta: { label: 'Send your profile', href: '#contact' },
    },
  },
  {
    id: 'photo-1776248783518-400b6d0da64c',
    alt: 'Team of professionals giving a thumbs up in a conference room',
    position: 'object-[62%_center] lg:object-[center_40%]',
    layout: 'full',
    caption: {
      eyebrow: 'For employers',
      title: 'Teams that perform from day one.',
      text: 'Mid-level and leadership hires, assessed for skills and culture fit.',
      cta: { label: 'Share a requirement', href: '#contact' },
    },
  },
]
