import * as React from 'react'

export type CardRadius = 'base' | 'lg'

const RADIUS_CLASSES: Record<CardRadius, string> = {
  base: 'rounded-(--radius)',
  lg: 'rounded-(--radius-lg)',
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  radius?: CardRadius
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevated = false, radius = 'base', className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`border border-(--border) ${RADIUS_CLASSES[radius]} ${elevated ? 'bg-(--surface-elevated)' : 'bg-(--surface)'} ${className}`.trim()}
      {...props}
    />
  )
})
