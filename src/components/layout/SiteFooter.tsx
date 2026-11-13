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

// Same profiles as organizationJsonLd().sameAs.
const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Jobeneu/100066505480256/',
    path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/joben.eu',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.981C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/jobeneu/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@getjoben.eu',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
]

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const productLinks = t.raw('productLinks') as { href: string; label: string }[]
  const companyLinks = t.raw('companyLinks') as { href: string; label: string }[]
  const legalLinks = t.raw('legalLinks') as { href: string; label: string }[]
  const locale = (await getLocale()) as AppLocale
  const labels = RESOURCE_LABELS[locale] ?? RESOURCE_LABELS.ro
  const resourceLinks = [
    { href: `/${GUIDE_SEGMENT.guide[locale] ?? 'ghiduri'}`, label: labels.guides },
    { href: `/${GUIDE_SEGMENT.glossary[locale] ?? 'glosar'}`, label: labels.glossary },
    { href: `/${CV_TEMPLATES_SEGMENT[locale] ?? 'sabloane-cv'}`, label: labels.templates },
  ]

  const columns = [
    { heading: t('productHeading'), links: productLinks },
    { heading: labels.heading, links: resourceLinks },
    { heading: t('companyHeading'), links: companyLinks },
  ]
  const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground'

  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto max-w-(--container-max) px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="max-w-sm">
            <span className="text-lg font-bold tracking-tight text-foreground">Joben</span>
            <p className="mt-2 text-sm text-muted-foreground">{t('tagline')}</p>
            <div className="mt-4 flex items-center gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={`Joben pe ${s.label}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-foreground">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className={linkClass}>
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('legalHeading')}</h3>
            <ul className="mt-3 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('http') ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}
                    </a>
                  ) : (
                    <AppLink href={link.href} className={linkClass}>
                      {link.label}
                    </AppLink>
                  )}
                </li>
              ))}
              <li>
                <CookieSettingsLink />
              </li>
            </ul>
          </div>
        </div>

        <div data-nosnippet className="mt-8 flex flex-col items-start gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-xs text-muted-foreground">{t('creatorCredit')}</p>
            <CompanyDetails className="text-xs text-muted-foreground" />
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://www.producthunt.com/products/joben"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
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
