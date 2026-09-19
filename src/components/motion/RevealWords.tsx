"use client"

import type { CSSProperties, ElementType } from 'react'
import { useReveal } from './useReveal'

type RevealWordsProps = {
  text: string
  as?: ElementType
  className?: string
}

// Overflow-hidden mask + translateY per word, staggered 60ms apart
// (--reveal-i, consumed by .reveal-line's transition-delay in globals.css).
export function RevealWords({ text, as: As = 'span', className = '' }: RevealWordsProps) {
  const { ref, revealed } = useReveal<HTMLElement>(0.4)
  const words = text.trim().split(/\s+/)

  return (
    <As ref={ref} className={className}>
      {words.map((word, i) => (
        <span className="reveal-mask" key={`${word}-${i}`}>
          <span
            className={`reveal-line${revealed ? ' is-revealed' : ''}`}
            style={{ '--reveal-i': i } as CSSProperties}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </As>
  )
}
