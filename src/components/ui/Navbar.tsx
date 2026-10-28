"use client"

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Menu, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { atsCheckerPath } from '@/lib/ats-checker-path'
import { GUIDE_SEGMENT } from '@/data/guides'
import type { AppLocale } from '@/i18n/routing'
import { AppLink } from '@/components/ui/AppLink'
import { Button, buttonVariants } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher'

const NAV_LINK_CLASSES = 'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth()
  const t = useTranslations('Nav')
  const locale = useLocale()
  const signedIn = isLoaded && isSignedIn

  const publicLinks = [
    { href: atsCheckerPath(locale), label: t('features') },
    { href: '/pricing', label: t('pricing') },
    { href: `/${GUIDE_SEGMENT.guide[locale as AppLocale] ?? 'ghiduri'}`, label: t('guides') },
  ]

  const appLinks = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/resumes', label: t('resumes') },
    { href: '/cover-letters', label: t('coverLetters') },
    { href: '/ai-review', label: t('aiReview') },
  ]

  const links = signedIn ? appLinks : publicLinks

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background">
      <section className="mx-auto flex h-16 max-w-(--container-max) items-center justify-between px-4 sm:px-6 lg:px-8">
        <section className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-md">
              <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" priority />
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">Joben</span>
          </Link>

          <section className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <AppLink key={link.href} href={link.href} className={NAV_LINK_CLASSES}>
                {link.label}
              </AppLink>
            ))}
          </section>
        </section>

        <section className="flex items-center gap-2 sm:gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
          {isLoaded && !signedIn && (
            <>
              <AppLink href="/sign-in" className={`hidden sm:block ${NAV_LINK_CLASSES}`}>
                {t('logInCta')}
              </AppLink>
              <TrackedLink
                href={atsCheckerPath(locale)}
                ctaId="nav_ats_check"
                className={`hidden sm:inline-flex ${buttonVariants('default', 'sm')}`}
              >
                {t('checkCv')}
              </TrackedLink>
            </>
          )}

          {signedIn && (
            <>
              <AppLink href="/resumes/new" className={`hidden sm:inline-flex ${buttonVariants('default', 'sm')}`}>
                <Plus />
                <span>{t('createNew')}</span>
              </AppLink>
              <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9 border border-border' } }} />
            </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('menu')}>
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {links.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <AppLink href={link.href}>{link.label}</AppLink>
                </DropdownMenuItem>
              ))}
              {isLoaded && !signedIn && (
                <>
                  <DropdownMenuItem asChild>
                    <AppLink href="/sign-in">{t('logInCta')}</AppLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <TrackedLink href={atsCheckerPath(locale)} ctaId="nav_ats_check_mobile" className="font-medium text-primary">
                      {t('checkCv')}
                    </TrackedLink>
                  </DropdownMenuItem>
                </>
              )}
              {signedIn && (
                <DropdownMenuItem asChild>
                  <AppLink href="/resumes/new">{t('createNew')}</AppLink>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
      </section>
    </nav>
  )
}
