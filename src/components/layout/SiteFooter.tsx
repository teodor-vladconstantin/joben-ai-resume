import Image from 'next/image'
import { AppLink } from '@/components/ui/AppLink'
import { getLocale, getTranslations } from 'next-intl/server'
import { CompanyDetails } from '@/components/layout/CompanyDetails'
import { CookieSettingsLink } from '@/components/layout/CookieSettingsLink'
import { GUIDE_SEGMENT } from '@/data/guides'
import { CV_TEMPLATES_SEGMENT } from '@/components/seo/CvTemplatesPage'
import type { AppLocale } from '@/i18n/routing'

// Resource pages use a different URL segment per locale, so the links are built here.
const RESOURCE_LABELS: Record<AppLocale, { guides: string; glossary: string; templates: string; heading: string }> = {
  ro: { guides: 'Ghiduri', glossary: 'Glosar', templates: 'Șabloane CV', heading: 'Resurse' },
  en: { guides: 'Guides', glossary: 'Glossary', templates: 'CV templates', heading: 'Resources' },
}

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const productLinks = t.raw('productLinks') as { href: string; label: string }[]
  const legalLinks = t.raw('legalLinks') as { href: string; label: string }[]
  const locale = (await getLocale()) as AppLocale
  const labels = RESOURCE_LABELS[locale] ?? RESOURCE_LABELS.ro
  const resourceLinks = [
    { href: `/${GUIDE_SEGMENT.guide[locale] ?? 'ghiduri'}`, label: labels.guides },
    { href: `/${GUIDE_SEGMENT.glossary[locale] ?? 'glosar'}`, label: labels.glossary },
    { href: `/${CV_TEMPLATES_SEGMENT[locale] ?? 'sabloane-cv'}`, label: labels.templates },
  ]

  return (
    <footer className="border-t border-(--border) bg-(--background) py-10">
      <div className="mx-auto max-w-(--container-max) px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <span className="text-lg font-bold tracking-tight text-(--foreground)">Joben</span>
            <p className="mt-2 text-sm text-(--muted)">{t('tagline')}</p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div>
              <h3 className="font-mono text-(length:--text-label) text-(--muted)">{t('productHeading')}</h3>
              <ul className="mt-3 space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className="text-sm text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground)">
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-(length:--text-label) text-(--muted)">{labels.heading}</h3>
              <ul className="mt-3 space-y-2">
                {resourceLinks.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className="text-sm text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground)">
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-(length:--text-label) text-(--muted)">{t('legalHeading')}</h3>
              <ul className="mt-3 space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className="text-sm text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground)">
                      {link.label}
                    </AppLink>
                  </li>
                ))}
                <li>
                  <CookieSettingsLink />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 border-t border-(--border) pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xs text-(--muted)">{t('creatorCredit')}</p>
            <CompanyDetails className="text-xs text-(--muted)" />
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.producthunt.com/products/joben"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-(--muted) transition-colors duration-150 ease-out hover:text-(--foreground)"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M13.604 8.4h-3.405V12h3.405c.995 0 1.801-.806 1.801-1.801 0-.993-.805-1.799-1.801-1.799zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804c2.319 0 4.2 1.88 4.2 4.199 0 2.321-1.881 4.201-4.201 4.201z" />
              </svg>
              <span>{t('productHuntLabel')}</span>
            </a>

            <a
              href="https://reclamatiisal.anpc.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Image
                src="/legal/anpc-sal-badge.png"
                alt={t('salBadgeAlt')}
                width={125}
                height={31}
                className="h-auto w-[125px] rounded"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
