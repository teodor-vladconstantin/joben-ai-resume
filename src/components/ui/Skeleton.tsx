import { cn } from '@/lib/cn'

// A single pulsing block — animate-pulse is opacity-only, so it's already
// within the transform/opacity/clip-path-only motion rule.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse bg-(--border)', className)} />
}

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-4 py-3', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-4 w-10" />
    </div>
  )
}
