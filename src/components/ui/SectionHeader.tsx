import { cn } from '@/lib/cn'

export interface SectionHeaderProps {
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <h2 className="text-(length:--text-h2) font-bold tracking-tight text-(--foreground)">{title}</h2>
      {description && (
        <p className="mt-3 text-(length:--text-body-lg) text-(--muted)">{description}</p>
      )}
    </div>
  )
}
