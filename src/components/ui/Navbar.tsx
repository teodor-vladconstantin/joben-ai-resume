"use client"

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { motion } from 'framer-motion'
import { buttonVariants } from '@/components/ui/Button'

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
    <nav className="fixed top-0 z-50 w-full border-b border-(--border) bg-(--background)/90 backdrop-blur-md">
      <section className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <section className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg">
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

          <section className="hidden items-center space-x-1 md:flex">
            {(isLoaded && isSignedIn ? appLinks : publicLinks).map((link) => (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-(--muted) transition-colors hover:text-(--foreground)"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </section>
        </section>

        <section className="flex items-center space-x-3">
          {isLoaded && !isSignedIn && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link href="/sign-in" className="text-sm font-medium text-(--muted) hover:text-(--foreground)">
                  {t('logIn')}
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <AuthAwareSignupLink className={buttonVariants('primary', 'sm')}>
                  {t('getStartedFree')}
                </AuthAwareSignupLink>
              </motion.div>
            </>
          )}

          {isLoaded && isSignedIn && (
            <>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href="/resumes/new"
                  className={`hidden sm:flex items-center gap-1.5 ${buttonVariants('primary', 'sm')}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('createNew')}</span>
                </Link>
              </motion.div>
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
