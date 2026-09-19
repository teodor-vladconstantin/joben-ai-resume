import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-(--background) flex items-center px-4">
      <div className="max-w-md">
        <p className="font-mono text-sm text-(--muted) mb-3">404</p>
        <h1 className="text-2xl font-bold text-(--foreground) mb-3">Page not found</h1>
        <p className="text-(--muted) text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants('primary', 'md')}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
