import * as React from 'react'
import { cn } from '@/lib/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-(--border) bg-(--surface) px-3 py-2 text-(--foreground) placeholder:text-(--muted) transition-colors duration-150 ease-out outline-none focus:border-(--accent)',
        className
      )}
      {...props}
    />
  )
})
