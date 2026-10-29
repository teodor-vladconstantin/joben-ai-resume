import Link from 'next/link'
import './[locale]/globals.css'

// Rendered for URLs that match no route, so there is no locale to read.
// Both languages are shown.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="bg-(--background) text-(--foreground) min-h-screen flex items-center px-4 font-sans">
        <main className="mx-auto w-full max-w-xl">
          <p aria-hidden="true" className="font-mono font-bold leading-none text-(--accent) text-8xl sm:text-9xl mb-6">
            404
          </p>
          <h1 className="text-3xl font-bold mb-3">Page not found</h1>
          <p className="text-(--muted) mb-1">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
          <p className="text-(--muted) mb-8">Pagina pe care o cauți nu există sau a fost mutată.</p>
          <div className="flex gap-3">
            <Link href="/en" className="underline underline-offset-4 hover:text-(--accent)">English</Link>
            <Link href="/ro" className="underline underline-offset-4 hover:text-(--accent)">Română</Link>
          </div>
        </main>
      </body>
    </html>
  )
}
