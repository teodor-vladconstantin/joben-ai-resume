import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors duration-150',
  {
    variants: {
      variant: {
        neutral:
          'bg-bg-elevated text-text-secondary border-border-soft',
        accent:
          'bg-accent-muted text-accent border-accent-border',
        success:
          'bg-success-muted text-success border-success/25',
        error:
          'bg-error-muted text-error border-error/25',
        warning:
          'bg-warning-muted text-warning border-warning/25',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}
