import type { ReactNode } from 'react'

export interface EmptyStateProps {
  index?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

// Same visual language as the score treatment: a big mono number, a thin
// rule underneath, then the message — instead of generic placeholder copy.
export function EmptyState({ index = '00', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`py-16 text-center ${className}`.trim()}>
      <p className="font-mono text-6xl md:text-7xl font-bold text-(--border) leading-none">{index}</p>
      <div className="mx-auto mt-4 h-px w-16 bg-(--border)" />
      <p className="mt-6 text-(--foreground) font-semibold">{title}</p>
      {description ? <p className="mt-2 text-sm text-(--muted) max-w-sm mx-auto">{description}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
