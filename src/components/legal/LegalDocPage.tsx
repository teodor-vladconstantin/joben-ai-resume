import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { CompanyDetails } from '@/components/layout/CompanyDetails'
import { JsonLd } from '@/components/seo/JsonLd'
import { LegalText } from '@/components/legal/LegalText'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { localeAlternates } from '@/lib/locale-alternates'
import type { AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

export type LegalDocKey = 'subprocessors' | 'refunds'

export async function legalDocMetadata(locale: AppLocale, key: LegalDocKey): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `Legal.${key}` })
  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: localeAlternates(locale, `/${key}`),
    openGraph: { title, description, url: `/${locale}/${key}`, siteName: 'Joben', locale: locale === 'ro' ? 'ro_RO' : 'en_US', type: 'website' },
  }
}

// Static legal document rendered from messages/*.json (same layout as Terms).
// `children` is optional extra content shown between the intro and the sections.
export async function LegalDocPage({ locale, docKey, children }: { locale: AppLocale; docKey: LegalDocKey; children?: ReactNode }) {
  const t = await getTranslations({ locale, namespace: 'Common' })
  const messages = (await getMessages({ locale })) as unknown as Messages
  const doc = messages.Legal[docKey]

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            breadcrumbJsonLd([
              { name: t('home'), path: `/${locale}` },
              { name: doc.breadcrumbLabel, path: `/${locale}/${docKey}` },
            ]),
          ],
        }}
      />
      <Navbar />
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <header className="mb-8 pb-8 border-b border-border">
          <h1 className="text-3xl font-bold text-foreground">{doc.heading}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{t('lastUpdated')}: {doc.lastUpdated}</p>
          <p className="mt-4 text-muted-foreground">{doc.intro}</p>
          <CompanyDetails className="mt-4 text-sm text-muted-foreground" />
        </header>
        {children}
        <article className="divide-y divide-border">
          {doc.sections?.map((section) => (
            <section key={section.title} className="py-8 first:pt-0">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <LegalText text={section.content} />
            </section>
          ))}
        </article>
        <p className="mt-8 text-sm text-muted-foreground">
          {doc.footerPrefix}
          <Link href="/privacy" className="text-foreground border-b border-transparent hover:border-primary transition-colors duration-150 ease-out">{doc.footerLinkLabel}</Link>
          {doc.footerSuffix}
        </p>
      </main>
    </div>
  )
}
