import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-(--border) ${elevated ? 'bg-(--surface-elevated)' : 'bg-(--surface)'} ${className}`.trim()}
      {...props}
    />
  )
}
