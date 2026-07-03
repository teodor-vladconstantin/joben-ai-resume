import React from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full px-3 py-1.5',
          'bg-bg-subtle border border-border-soft',
          'text-text-primary text-body placeholder:text-text-muted',
          'rounded-md',
          'focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong',
          'transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
