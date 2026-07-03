import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'

export interface AuthShellProps {
  eyebrow: string
  heading: string
  subheading: string
  children: React.ReactNode
}

export function AuthShell({ eyebrow, heading, subheading, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16" suppressHydrationWarning>
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true" suppressHydrationWarning>
        <div className="w-150 h-150 bg-(--accent)/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <Card elevated radius="lg" className="p-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" />
            </span>
            <span className="text-xl font-bold tracking-tight text-(--foreground)">Joben</span>
          </Link>

          <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
          <h1 className="text-2xl font-bold text-(--foreground) mb-2">{heading}</h1>
          <p className="text-sm text-(--muted) mb-8">{subheading}</p>

          {children}
        </Card>

        <div className="mt-6 flex items-center justify-between text-xs text-(--muted)">
          <Link href="/" className="hover:text-(--foreground)">&larr; Back to home</Link>
          <span className="font-mono uppercase tracking-wide">ATS-Optimized &middot; AI-Powered</span>
        </div>
      </div>
    </div>
  )
}
