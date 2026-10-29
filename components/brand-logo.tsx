import Link from 'next/link'
import { SITE } from '@/lib/site'

/**
 * A3A logo lockup: round logo mark + "A3A" wordmark (3 in brand orange, as in the logo)
 * + "Staffing Solutions" + the logo tagline on wide screens.
 * Use variant="dark" on navy/black backgrounds.
 */
export function BrandLogo({ href = '/', variant = 'light' }: { href?: string; variant?: 'light' | 'dark' }) {
  const dark = variant === 'dark'
  return (
    <Link href={href} className="group flex items-center gap-3 sm:gap-3.5" aria-label="A3A Staffing Solutions home">
      <span className="relative block shrink-0 overflow-hidden rounded-full bg-white ring-[3px] ring-brand-500 shadow-[0_8px_22px_-8px_rgba(244,115,20,.7)] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
        {/* Slight zoom trims the dark corners of the square logo file. */}
        <img src={SITE.logoUrl} alt="A3A Staffing Solutions logo" width={64} height={64} className="size-12 scale-[1.08] object-cover sm:size-14" />
      </span>
      <span className="leading-none">
        <span className={`block font-display text-[1.75rem] font-extrabold tracking-[-.05em] sm:text-[2.1rem] ${dark ? 'text-white' : 'text-navy-950'}`}>
          A<span className="text-brand-500">3</span>A
        </span>
        <span className={`mt-1 block text-[11px] font-extrabold uppercase tracking-[.22em] sm:text-[13px] ${dark ? 'text-slate-300' : 'text-charcoal'}`}>
          Staffing Solutions
        </span>
        <span className={`mt-1.5 hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.14em] xl:flex ${dark ? 'text-brand-400' : 'text-brand-600'}`}>
          <span className="h-px w-3 bg-brand-500" /> Right people · Right opportunities · Right time
        </span>
      </span>
    </Link>
  )
}
