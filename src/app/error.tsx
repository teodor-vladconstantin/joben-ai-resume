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
    <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-white/40 text-sm font-mono mb-3">500</p>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-white/50 text-sm mb-8">
          An unexpected error occurred. If this keeps happening, please refresh or contact support.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
