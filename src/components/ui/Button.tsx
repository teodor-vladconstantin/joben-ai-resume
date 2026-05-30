import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-body font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-accent hover:bg-accent-hover text-white border border-accent-border',
        ghost:
          'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary border border-transparent',
        outline:
          'bg-transparent hover:bg-bg-hover text-text-primary border border-border-soft',
        destructive:
          'bg-transparent hover:bg-error/10 text-error border border-transparent hover:border-error/20',
      },
      size: {
        sm: 'px-2 py-1 text-small',
        md: 'px-3 py-1.5 text-body',
        lg: 'px-4 py-2 text-heading',
        icon: 'size-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}
