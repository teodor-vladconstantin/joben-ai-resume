"use client"

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { buttonVariants } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'

const NAV_LINK_CLASSES =
  'block border-b border-transparent px-1 py-2 text-sm font-medium text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground) hover:border-(--accent)'

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth()
  const t = useTranslations('Nav')

  const publicLinks = [
    { href: '/#builder', label: t('aiResumeBuilder') },
    { href: '/free-ats-checker', label: t('atsAnalysis') },
    { href: '/resume-examples', label: t('examples') },
    { href: '/#pricing', label: t('pricing') },
    { href: '/#faq', label: t('faq') },
  ]

  const appLinks = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/resumes', label: t('resumes') },
    { href: '/cover-letters', label: t('coverLetters') },
    { href: '/ai-review', label: t('aiReview') },
  ]

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-(--border) bg-(--background)">
      <section className="mx-auto flex h-16 max-w-(--container-max) items-center justify-between px-4 sm:px-6 lg:px-8">
        <section className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/jobeneu_logo.jpg"
                alt="Joben logo"
                fill
                sizes="32px"
                className="object-cover"
                priority
              />
            </span>
            <span className="text-2xl font-bold tracking-tight text-(--foreground)">Joben</span>
          </Link>

          <section className="hidden items-center space-x-6 md:flex">
            {(isLoaded && isSignedIn ? appLinks : publicLinks).map((link) => (
              <Link key={link.href} href={link.href} className={NAV_LINK_CLASSES}>
                {link.label}
              </Link>
            ))}
          </section>
        </section>

        <section className="flex items-center space-x-6">
          <LocaleSwitcher />
          <ThemeToggle />
          {isLoaded && !isSignedIn && (
            <>
              <Link href="/sign-in" className={NAV_LINK_CLASSES}>
                {t('logIn')}
              </Link>
              <AuthAwareSignupLink className={buttonVariants('primary', 'sm')}>
                {t('getStartedFree')}
              </AuthAwareSignupLink>
            </>
          )}

          {isLoaded && isSignedIn && (
            <>
              <Link
                href="/resumes/new"
                className={`hidden sm:flex items-center gap-1.5 ${buttonVariants('primary', 'sm')}`}
              >
                <Plus className="h-4 w-4" />
                <span>{t('createNew')}</span>
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 border border-(--border)'
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
