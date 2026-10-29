'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Pause, Play } from 'lucide-react'
import { photoUrl } from '@/lib/site'

export interface HeroSlide {
  id: string
  alt: string
  /** Tailwind object-position classes for the photo. */
  position: string
  /**
   * "split": photo sits on the right part of the banner (desktop) so the intro panel never covers the people.
   * "full": photo fills the banner and only a small caption card is shown.
   */
  layout: 'split' | 'full'
  /** Small caption card for "full" slides. "split" slides show the intro panel instead. */
  caption?: { eyebrow: string; title: string; text: string; cta: { label: string; href: string } }
  /** Where the caption bar sits horizontally, e.g. "justify-start" or "lg:justify-end". Defaults to the left. */
  captionAlign?: string
}

/**
 * Hero banner slideshow. Slide 1 shows the main headline panel; the following slides show
 * their own short caption so the photos stay visible. Slow crossfade with a gentle zoom;
 * all slides render up front so each photo is already loaded when it fades in.
 */
export function HeroSlideshow({ slides, intro, interval = 6500 }: { slides: readonly HeroSlide[]; intro: ReactNode; interval?: number }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length < 2) return
    // A timeout keyed on `index` restarts the countdown whenever a dot is clicked.
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % slides.length), interval)
    return () => window.clearTimeout(timer)
  }, [index, paused, interval, slides.length])

  return (
    <section className="relative isolate overflow-hidden bg-navy-950" aria-roledescription="carousel" aria-label="A3A Staffing highlights">
      {/* Photos */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide, i) => {
          const active = i === index
          const split = slide.layout === 'split'
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              className={`absolute right-0 top-0 overflow-hidden transition-opacity duration-[1200ms] ${active ? 'opacity-100' : 'opacity-0'} ${split ? 'left-0 h-[22rem] sm:bottom-0 sm:h-auto lg:left-[36%] lg:[mask-image:linear-gradient(to_right,transparent,#000_24%)]' : 'bottom-0 left-0'}`}
            >
              <img
                src={photoUrl(slide.id, 1800)}
                srcSet={`${photoUrl(slide.id, 800)} 800w, ${photoUrl(slide.id, 1200)} 1200w, ${photoUrl(slide.id, 1800)} 1800w, ${photoUrl(slide.id, 2400)} 2400w`}
                sizes={split ? '(min-width: 1024px) 64vw, 100vw' : '100vw'}
                alt={active ? slide.alt : ''}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                className={`size-full object-cover ease-out motion-reduce:!scale-100 ${slide.position} ${active ? 'scale-100' : 'scale-[1.06]'}`}
                style={{ transition: 'transform 7000ms' }}
              />
              {/* Shade so text stays readable while the photo stays vivid */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/35 to-transparent ${split ? 'sm:bg-gradient-to-r sm:from-navy-950/70 sm:via-navy-950/10 lg:from-navy-950/30' : 'sm:bg-gradient-to-tr sm:from-navy-950/85 sm:via-navy-950/15'}`}
              />
            </div>
          )
        })}
      </div>
      {/* Brand glow on the navy side of slide 1 */}
      <div className={`absolute -left-24 top-1/4 -z-10 hidden size-[28rem] rounded-full bg-brand-500/15 blur-3xl transition-opacity duration-1000 lg:block ${slides[index]?.layout === 'split' ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-navy-950/60 to-transparent" aria-hidden="true" />

      {/* Slide content: every slide occupies the same grid cell, so the hero height never jumps */}
      <div className="mx-auto grid max-w-7xl px-5 pb-24 pt-64 [grid-template-areas:'stack'] sm:pb-28 sm:pt-12 lg:px-8 lg:pb-28 lg:pt-12">
        {slides.map((slide, i) => {
          const active = i === index
          const state = active ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
          if (slide.layout === 'split' || !slide.caption) {
            return (
              <div key={slide.id} inert={!active} className={`grid items-center gap-8 transition-all duration-700 [grid-area:stack] lg:grid-cols-[minmax(0,600px)_1fr] ${state}`}>
                {intro}
                <div className="relative hidden h-full min-h-[400px] lg:block">
                </div>
              </div>
            )
          }
          const { eyebrow, title, text, cta } = slide.caption
          return (
            <div key={slide.id} inert={!active} className={`flex items-end transition-all duration-700 [grid-area:stack] ${slide.captionAlign ?? 'justify-start'} ${state}`}>
              {/* Slim caption bar: sits low in the frame (shoulders/desk level) so it never covers faces */}
              <div className="relative flex w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-2xl border border-white/20 bg-navy-950/55 py-4 pl-6 pr-4 shadow-[0_20px_50px_-15px_rgba(6,27,61,.6)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6">
                <div className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-brand-500" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[.22em] text-brand-400">{eyebrow}</p>
                  <p className="mt-1 text-xl font-extrabold leading-snug tracking-[-.03em] text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-slate-300">{text}</p>
                </div>
                <a href={cta.href} className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 sm:self-auto">
                  {cta.label} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {slides.length > 1 && (
        <div className="absolute right-5 top-[13.5rem] z-10 flex items-center gap-2 rounded-full border border-white/25 bg-navy-950/35 py-1.5 pl-3 pr-1.5 backdrop-blur-md sm:bottom-24 sm:top-auto lg:right-8">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1} of ${slides.length}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-7 bg-brand-500' : 'w-2 bg-white/60 hover:bg-white'}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            className="ml-1 flex size-6 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
          </button>
        </div>
      )}
    </section>
  )
}
