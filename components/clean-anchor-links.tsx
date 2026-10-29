'use client'

import { useEffect } from 'react'
import { SECTION_PATHS } from '@/lib/site'

const SECTIONS = new Set<string>(SECTION_PATHS)

/** "/about" -> "about"; "/" -> "" ; anything else -> null */
function sectionOf(pathname: string): string | null {
  const name = pathname.replace(/^\/+|\/+$/g, '')
  if (name === '') return ''
  return SECTIONS.has(name) ? name : null
}

function scrollToSection(name: string, smooth = true) {
  const behavior: ScrollBehavior = smooth ? 'smooth' : 'auto'
  if (!name) {
    window.scrollTo({ top: 0, behavior })
    return true
  }
  const target = document.getElementById(name)
  if (!target) return false
  target.scrollIntoView({ behavior, block: 'start' })
  return true
}

/**
 * Clean section addresses for the one-page home: menu links point to /about, /services …,
 * clicking one scrolls smoothly to that section and shows its address (no "#").
 * Opening /contact directly (next.config.mjs rewrites it to the home page) scrolls to Contact.
 */
export function CleanAnchorLinks() {
  useEffect(() => {
    // Only on the home page (or one of its section addresses).
    if (sectionOf(window.location.pathname) === null) return
    // We scroll to sections ourselves, so stop the browser restoring old scroll positions.
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a[href]')
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank') return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      // Old-style "#section" links and "/section" links both work.
      const name = url.hash && url.pathname === window.location.pathname ? url.hash.slice(1) : sectionOf(url.pathname)
      if (name === null || name === undefined) return
      if (!scrollToSection(name === 'home' ? '' : name)) return
      event.preventDefault()
      const path = name && name !== 'home' ? `/${name}` : '/'
      if (window.location.pathname + window.location.hash !== path) window.history.pushState(window.history.state, '', path)
    }

    // Back/forward between section addresses: scroll to the matching section.
    const onPopState = () => {
      const name = sectionOf(window.location.pathname)
      // Wait a moment so the Next.js router finishes handling the history change first.
      if (name !== null) window.setTimeout(() => scrollToSection(name), 60)
    }

    // Opened at /contact (or an old /#contact link): scroll there once the page has rendered.
    const timer = window.setTimeout(() => {
      const fromHash = window.location.hash.slice(1)
      if (fromHash && SECTIONS.has(fromHash)) {
        scrollToSection(fromHash, false)
        window.history.replaceState(window.history.state, '', `/${fromHash}`)
        return
      }
      const name = sectionOf(window.location.pathname)
      if (name) scrollToSection(name, false)
    }, 300)

    // Capture phase: runs before Next.js <Link> handlers (e.g. the logo), which then skip the click.
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
      window.clearTimeout(timer)
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  return null
}
