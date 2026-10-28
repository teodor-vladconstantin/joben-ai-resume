"use client"

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

// Slugs differ per locale (/ro/resume-examples/analist-date vs
// /en/resume-examples/data-analyst), so the same path under the other locale
// 404s. Every page already emits its true counterpart as a hreflang alternate;
// read it from there. A button, not a link, so crawlers don't follow guessed URLs.
export function LocaleSwitcher({ className = '' }: { className?: string }) {
  const t = useTranslations('Common')
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const other = routing.locales.find((l) => l !== locale) ?? routing.locales[0]

  function switchLocale() {
    const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${other}"]`)?.href
    if (alt) {
      const url = new URL(alt)
      window.location.assign(url.pathname + url.search)
    } else {
      router.replace(pathname, { locale: other })
    }
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      aria-label={other === 'ro' ? t('switchToRomanian') : t('switchToEnglish')}
      className={`inline-flex h-8 items-center px-1 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground ${className}`.trim()}
    >
      {other.toUpperCase()}
    </button>
  )
}
