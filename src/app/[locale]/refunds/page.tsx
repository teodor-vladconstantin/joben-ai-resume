import type { Metadata } from 'next'

import { LegalDocPage, legalDocMetadata } from '@/components/legal/LegalDocPage'
import type { AppLocale } from '@/i18n/routing'
import { enableRequestLocale } from '@/i18n/request-locale'

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  return legalDocMetadata(enableRequestLocale((await params).locale), 'refunds')
}

export default async function RefundsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  return <LegalDocPage locale={enableRequestLocale((await params).locale)} docKey="refunds" />
}
