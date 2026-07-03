import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-white/40 text-sm font-mono mb-3">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-white/50 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
