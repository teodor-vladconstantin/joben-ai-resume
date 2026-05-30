"use client"
import { useEffect } from 'react'

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
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-text-muted text-small font-mono mb-3">500</p>
        <h1 className="text-title font-medium text-text-primary mb-3">Something went wrong</h1>
        <p className="text-text-secondary text-small mb-8">
          An unexpected error occurred. If this keeps happening, please refresh or contact support.
        </p>
        <button
          onClick={reset}
          className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
