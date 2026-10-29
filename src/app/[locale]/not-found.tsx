import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/Button'

// Resource pages use a different URL segment per locale.
const SEGMENTS = {
  ro: { ats: 'verificare-cv-ats', templates: 'sabloane-cv' },
  en: { ats: 'free-ats-checker', templates: 'cv-templates' },
} as const

export default async function NotFound() {
  const t = await getTranslations('ErrorPages.notFound')
  const locale = await getLocale()
  const seg = SEGMENTS[locale === 'en' ? 'en' : 'ro']

  const links = [
    { href: `/${seg.ats}`, label: t('linkAts') },
    { href: `/${seg.templates}`, label: t('linkTemplates') },
    { href: '/resume-examples', label: t('linkExamples') },
  ]

  return (
    <main className="min-h-screen bg-(--background) flex items-center px-4 py-16">
      <div className="mx-auto w-full max-w-xl">
        <p
          aria-hidden="true"
          className="font-mono font-bold leading-none text-(--accent) text-8xl sm:text-9xl mb-6"
        >
          404
        </p>
        <h1 className="text-3xl font-bold text-(--foreground) mb-3">{t('title')}</h1>
        <p className="text-(--muted) mb-8">{t('description')}</p>
        <Link href="/" className={buttonVariants('primary', 'md')}>
          {t('cta')}
        </Link>

        <div className="mt-12 border-t border-(--border) pt-6">
          <p className="font-mono text-xs uppercase tracking-wide text-(--muted) mb-3">
            {t('popular')}
          </p>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-(--foreground) underline underline-offset-4 hover:text-(--accent)"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
