"use client"

import { useEffect, useRef, useState } from 'react'

// Fires once: disconnects the observer the moment the element enters
// view, so the reveal never re-triggers on scroll back up.
//
// Backstop: content behind these reveals is real page content, not
// decoration, so it must never stay hidden forever if the observer never
// fires (backgrounded/throttled tabs, an odd embedding context, a browser
// quirk). A 2s fallback timer reveals unconditionally if intersection
// hasn't already done so — harmless when the observer works normally,
// since it always resolves well before 2s for anything near the viewport.
export function useReveal<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reveal = () => setRevealed(true)
    const fallback = window.setTimeout(reveal, 2000)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.clearTimeout(fallback)
          reveal()
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [threshold])

  return { ref, revealed }
}
