import * as React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Accent only ever appears as a fill with the fixed --accent-ink text on
  // top — not --foreground, which flips light/dark and would fail contrast
  // in dark mode (see the --accent-ink comment in globals.css).
  primary:
    'bg-(--accent) text-(--accent-ink) hover:bg-(--accent-strong)',
  secondary:
    'bg-transparent text-(--foreground) border border-(--border) hover:border-(--accent)',
  ghost:
    'bg-transparent text-(--foreground)/75 hover:text-(--foreground)',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-lg gap-2',
}

export function buttonVariants(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center rounded-none font-medium transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`
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
