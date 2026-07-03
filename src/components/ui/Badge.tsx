import * as React from 'react'

export type BadgeVariant = 'solid' | 'muted'

const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  solid: 'bg-(--accent) text-(--background)',
  muted: 'bg-(--accent-muted) text-(--accent)',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'solid', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${BADGE_VARIANT_CLASSES[variant]} ${className}`.trim()}
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
    <span className={`inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wide text-(--accent) ${className}`.trim()}>
      <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
      {children}
    </span>
  )
}
