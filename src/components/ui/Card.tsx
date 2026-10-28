import * as React from 'react'

export type CardRadius = 'base' | 'lg'

// 'lg' is kept as a prop for callers migrating incrementally; both map to the same radius.

const RADIUS_CLASSES: Record<CardRadius, string> = {
  base: 'rounded-lg',
  lg: 'rounded-lg',
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
      className={`border border-border ${RADIUS_CLASSES[radius]} bg-card shadow-card ${className}`.trim()}
      {...props}
    />
  )
})
