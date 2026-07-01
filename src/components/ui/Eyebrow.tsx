import { cn } from '@/lib/cn'

type EyebrowProps = React.HTMLAttributes<HTMLDivElement>

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-text-muted',
        className
      )}
      {...props}
    >
      <span className="size-1 shrink-0 rounded-full bg-accent" />
      {children}
    </div>
  )
}
