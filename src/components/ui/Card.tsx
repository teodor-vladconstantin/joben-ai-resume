import { cn } from '@/lib/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-soft rounded-lg p-4',
        className
      )}
      {...props}
    />
  )
}

interface CardClickableProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardClickable({ className, ...props }: CardClickableProps) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border-soft rounded-lg p-4',
        'hover:border-border-medium hover:bg-bg-hover',
        'cursor-pointer transition-colors duration-150',
        className
      )}
      {...props}
    />
  )
}

interface CardElevatedProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardElevated({ className, ...props }: CardElevatedProps) {
  return (
    <div
      className={cn(
        'bg-bg-elevated border border-border-medium rounded-xl p-6',
        className
      )}
      {...props}
    />
  )
}
