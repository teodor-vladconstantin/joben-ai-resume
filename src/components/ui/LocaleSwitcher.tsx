"use client"

import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const pathname = usePathname()
  const locale = useLocale()
  const other = routing.locales.find((l) => l !== locale) ?? routing.locales[0]

  return (
    <Link
      href={pathname}
      locale={other}
      aria-label={`Switch to ${other === 'ro' ? 'Romanian' : 'English'}`}
      className={`inline-flex h-8 items-center px-1 text-sm font-medium text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground) ${className}`.trim()}
    >
      {other.toUpperCase()}
    </Link>
  )
}
