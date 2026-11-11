"use client"

import type { MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
import { routing, type AppLocale } from '@/i18n/routing'
import { alternatePathFromHead, fallbackLocalePath } from '@/lib/locale-switch'

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('Common')
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const other = routing.locales.find((l) => l !== locale) ?? routing.locales[0]
  // Crawlable href that is never a 404; the click upgrades it to the exact
  // counterpart (localized slug) from the page's own hreflang link.
  const href = fallbackLocalePath(pathname, locale, other)

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    const exact = alternatePathFromHead(document, other)
    if (exact && exact !== href) {
      event.preventDefault()
      router.push(exact, { locale: other })
    }
  }

  return (
    <Link
      href={href}
      locale={other}
      onClick={onClick}
      aria-label={other === 'ro' ? t('switchToRomanian') : t('switchToEnglish')}
      className={`inline-flex h-8 items-center px-1 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground ${className}`.trim()}
    >
      {other.toUpperCase()}
    </Link>
  )
}
