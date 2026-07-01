import { cn } from '@/lib/cn'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-bg-hover', className)}
      {...props}
    />
  )
}
