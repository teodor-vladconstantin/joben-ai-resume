import type { Metadata } from 'next'

import { LegalDocPage, legalDocMetadata } from '@/components/legal/LegalDocPage'
import type { AppLocale } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  return legalDocMetadata((await params).locale, 'refunds')
}

export default async function RefundsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  return <LegalDocPage locale={(await params).locale} docKey="refunds" />
}
