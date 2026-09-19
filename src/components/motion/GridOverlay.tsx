"use client"

import { useEffect, useState } from 'react'

// Press "g" to toggle a 12-column / 8px-baseline overlay, for checking
// layout against the grid. Ignored while typing in a field. Dev-only —
// doesn't mount at all in production, so the key does nothing there.
export function GridOverlay() {
  const [visible, setVisible] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!isDev) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'g') return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return

      setVisible((prev) => !prev)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDev])

  if (!isDev || !visible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-9999" aria-hidden="true">
      <div className="mx-auto grid h-full max-w-(--container-max) grid-cols-12 gap-4 px-4 sm:px-6 lg:px-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full bg-(--accent)/[0.06]" />
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, transparent) 0, color-mix(in srgb, var(--accent) 12%, transparent) 1px, transparent 1px, transparent 8px)',
        }}
      />
    </div>
  )
}
