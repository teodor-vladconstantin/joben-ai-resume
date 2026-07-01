import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Eyebrow } from './Eyebrow'

interface LockedFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  eyebrow?: string
  cta?: React.ReactNode
}

export function LockedFeatureCard({
  title,
  description,
  eyebrow = 'Coming soon',
  cta,
  className,
  ...props
}: LockedFeatureCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-accent-border bg-accent-muted p-4',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-accent-border bg-bg-elevated text-accent">
          <Lock size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <Eyebrow>{eyebrow}</Eyebrow>
          <p className="mt-1.5 text-body font-medium text-text-primary">{title}</p>
          <p className="mt-0.5 text-small text-text-secondary">{description}</p>
          {cta}
        </div>
      </div>
    </div>
  )
}
