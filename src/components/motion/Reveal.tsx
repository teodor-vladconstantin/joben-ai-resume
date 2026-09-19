"use client"

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { useReveal } from './useReveal'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  threshold?: number
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>

// clip-path inset() reveal for large elements (hero visuals, score cards,
// mock documents) — a curtain wipe rather than a fade.
export function Reveal({ children, as: As = 'div', className = '', threshold = 0.15, ...rest }: RevealProps) {
  const { ref, revealed } = useReveal<HTMLElement>(threshold)

  return (
    <As ref={ref} className={`reveal-clip${revealed ? ' is-revealed' : ''} ${className}`.trim()} {...rest}>
      {children}
    </As>
  )
}
