import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevated = false, className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-(--border) ${elevated ? 'bg-(--surface-elevated)' : 'bg-(--surface)'} ${className}`.trim()}
      {...props}
    />
  )
})
