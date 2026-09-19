"use client"

import { useReveal } from './useReveal'

// A 1px rule that draws in via scaleX (transform-origin: left) the first
// time it scrolls into view. `<hr>` can't take children, so this is its
// own component rather than a variant of Reveal.
export function RevealRule({ className = '' }: { className?: string }) {
  const { ref, revealed } = useReveal<HTMLHRElement>(0.4)

  return (
    <hr
      ref={ref}
      className={`reveal-rule${revealed ? ' is-revealed' : ''} border-(--border) ${className}`.trim()}
    />
  )
}
