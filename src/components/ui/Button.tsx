import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/cn'

const variants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-card hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-card hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-card hover:bg-accent hover:text-accent-foreground',
        secondary: 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

// 'primary' and 'md' are the legacy names still used by older call sites; migrate them to default.
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'md'

export function buttonVariants(variant: ButtonVariant = 'default', size: ButtonSize = 'default', className?: string): string {
  return variants({
    variant: variant === 'primary' ? 'default' : variant,
    size: size === 'md' ? 'default' : size,
    className,
  })
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants(variant, size), className)} {...props} />
  },
)
Button.displayName = 'Button'
