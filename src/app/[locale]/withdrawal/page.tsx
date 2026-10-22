import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { CompanyDetails } from '@/components/layout/CompanyDetails'
import { WithdrawalForm } from '@/components/legal/WithdrawalForm'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Withdrawal' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localeAlternates(locale, '/withdrawal'),
  }
}

export default async function WithdrawalPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Withdrawal' })

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <header className="mb-8 pb-8 border-b border-(--border)">
          <h1 className="text-3xl font-bold text-(--foreground)">{t('heading')}</h1>
          <p className="mt-4 text-(--muted)">{t('intro')}</p>
          <CompanyDetails className="mt-4 text-sm text-(--muted)" />
        </header>

        <WithdrawalForm />

        <p className="mt-8 text-sm text-(--muted)">
          {t('termsPrefix')}
          <Link href="/terms" className="text-(--foreground) border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{t('termsLink')}</Link>
          {t('termsSuffix')}
        </p>
      </main>
    </div>
  )
}
