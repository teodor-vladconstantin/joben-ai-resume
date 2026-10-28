import * as React from 'react'

export type BadgeVariant = 'solid' | 'muted'

// Accent only ever appears as a fill with --foreground text on top — as a
// text color (solo or over --accent-muted, which is still near-paper) it
// measures ~2.4:1 and fails the 4.5:1 threshold.
const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  solid: 'bg-primary text-primary-foreground',
  muted: 'bg-primary/10 text-foreground',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'solid', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${BADGE_VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...props}
    />
  )
}

export interface EyebrowProps {
  children: React.ReactNode
  className?: string
}

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground ${className}`.trim()}>
      <span className="h-1.5 w-1.5 bg-primary" aria-hidden="true" />
      {children}
    </span>
  )
}
