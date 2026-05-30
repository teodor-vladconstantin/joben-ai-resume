import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-text-muted text-small font-mono mb-3">404</p>
        <h1 className="text-title font-medium text-text-primary mb-3">Page not found</h1>
        <p className="text-text-secondary text-small mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
