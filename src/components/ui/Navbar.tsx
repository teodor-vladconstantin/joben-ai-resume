'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { FileText, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

export function Navbar() {
  const { isSignedIn } = useUser()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks: { label: string; href: string; auth?: boolean }[] = [
    { label: 'Resume Builder', href: '/resumes/new' },
    { label: 'AI Review', href: '/ai-review', auth: true },
    { label: 'Cover Letters', href: '/cover-letters/new', auth: true },
    { label: 'Pricing', href: '/pricing' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-bg-base/95 backdrop-blur-sm border-b border-border-faint">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors">
          <FileText size={18} />
          <span className="font-semibold text-heading">Joben</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.filter(l => !l.auth || isSignedIn).map(link => {
            const isActive = pathname?.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-body transition-colors',
                  isActive
                    ? 'bg-bg-hover text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
            >
              Sign In
            </Link>
          )}
          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-text-secondary hover:text-text-primary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-faint bg-bg-base px-4 py-3 space-y-1 animate-fade-in-up">
          {navLinks.filter(l => !l.auth || isSignedIn).map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-body text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
