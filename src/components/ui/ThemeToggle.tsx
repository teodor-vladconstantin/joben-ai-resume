"use client"

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // resolvedTheme is undefined until the client resolves "system" — render a
  // fixed-size placeholder pre-mount so the layout doesn't jump.
  React.useEffect(() => setMounted(true), [])

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label={mounted ? (resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
      className={`inline-flex h-8 w-8 items-center justify-center text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground) ${className}`.trim()}
    >
      {mounted ? (
        resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  )
}
