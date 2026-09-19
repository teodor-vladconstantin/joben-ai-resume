"use client"
import { useEffect } from 'react'
import { buttonVariants } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-(--background) flex items-center px-4">
      <div className="max-w-md">
        <p className="font-mono text-sm text-(--muted) mb-3">500</p>
        <h1 className="text-2xl font-bold text-(--foreground) mb-3">Something went wrong</h1>
        <p className="text-(--muted) text-sm mb-8">
          An unexpected error occurred. If this keeps happening, please refresh or contact support.
        </p>
        <button
          onClick={reset}
          className={buttonVariants('primary', 'md')}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
