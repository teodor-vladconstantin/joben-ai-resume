import * as React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-(--accent) text-(--background) hover:bg-(--accent-strong)',
  secondary:
    'bg-transparent text-(--foreground) border border-(--border) hover:border-(--accent)',
  ghost:
    'bg-transparent text-(--foreground)/75 hover:text-(--foreground)',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
}

export function buttonVariants(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center rounded-full font-medium transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${buttonVariants(variant, size)} ${className}`.trim()}
      {...props}
    />
  )
}
