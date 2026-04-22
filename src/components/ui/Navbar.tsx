"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth()

  const publicLinks = [
    { href: '/#builder', label: 'AI Resume Builder' },
    { href: '/#analysis', label: 'ATS Analysis' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
  ]

  const appLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/resumes', label: 'Resumes' },
    { href: '/cover-letters', label: 'Cover Letters' },
    { href: '/ai-review', label: 'AI Review' },
  ]

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#020202]/90 backdrop-blur-md">
      <section className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <section className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg shadow-lg shadow-[#0A9548]/25">
              <Image
                src="/jobeneu_logo.jpg"
                alt="Joben logo"
                fill
                sizes="32px"
                className="object-cover"
                priority
              />
            </span>
            <span className="text-2xl font-bold tracking-tight text-white">Joben</span>
          </Link>

          <section className="hidden items-center space-x-1 md:flex">
            {(isLoaded && isSignedIn ? appLinks : publicLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[#FFFFFF]/75 transition-colors hover:bg-[#0A0F0D] hover:text-[#FFFFFF]"
              >
                {link.label}
              </Link>
            ))}
          </section>
        </section>

        <section className="flex items-center space-x-3">
          {isLoaded && !isSignedIn && (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-[#FFFFFF]/75 hover:text-[#FFFFFF]">
                Log in
              </Link>
              <AuthAwareSignupLink
                className="rounded-md bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Get Started Free
              </AuthAwareSignupLink>
            </>
          )}

          {isLoaded && isSignedIn && (
            <>
              <Link
                href="/resumes/new"
                className="hidden items-center space-x-1 rounded-md bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex"
              >
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 border border-white/12'
                  }
                }}
              />
            </>
          )}
        </section>
      </section>
    </nav>
  )
}

