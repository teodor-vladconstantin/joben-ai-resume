import type { ElementType, ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  /** Kept for existing callers; no longer rendered. */
  index?: string
  icon?: ElementType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-4 py-14 text-center ${className}`.trim()}>
      <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}
