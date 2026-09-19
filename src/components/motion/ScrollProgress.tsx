"use client"

import { useEffect, useState } from 'react'

// 2px accent line tracking scroll position (direct, no easing — it has to
// track the scrollbar exactly) plus a mono label for whichever
// [data-section="…"] element currently sits nearest the viewport center.
// Sections are discovered from the DOM, not passed in, so any page can
// opt in just by tagging elements with data-section.
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [sectionLabel, setSectionLabel] = useState('')

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      setProgress(scrollable > 0 ? doc.scrollTop / scrollable : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const nearest = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setSectionLabel(nearest.target.getAttribute('data-section') || '')
      },
      { rootMargin: '-45% 0px -45% 0px' }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-0.5" aria-hidden="true">
        <div className="h-full bg-(--accent) origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>
      {sectionLabel ? (
        <div
          className="fixed bottom-4 right-4 z-40 hidden font-mono text-(length:--text-label) text-(--muted) lg:block"
          aria-hidden="true"
        >
          {sectionLabel}
        </div>
      ) : null}
    </>
  )
}
