import { cn } from '@/lib/cn'

export function Divider({ className, ...props }: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn('border-border-faint', className)}
      {...props}
    />
  )
}
