import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const productLinks = t.raw('productLinks') as { href: string; label: string }[]
  const legalLinks = t.raw('legalLinks') as { href: string; label: string }[]

  return (
    <footer className="border-t border-(--border) bg-(--background) py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <span className="text-lg font-bold tracking-tight text-(--foreground)">Joben</span>
            <p className="mt-2 text-sm text-(--muted)">{t('tagline')}</p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-(--foreground)">{t('productHeading')}</h3>
              <ul className="mt-3 space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-(--muted) hover:text-(--accent)">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-(--foreground)">{t('legalHeading')}</h3>
              <ul className="mt-3 space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-(--muted) hover:text-(--accent)">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start gap-4 border-t border-(--border) pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-(--muted)">{t('creatorCredit')}</p>

          <div className="flex items-center gap-4">
            <a
              href="https://www.producthunt.com/products/joben"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-(--muted) hover:text-(--accent)"
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
