import type { Metadata } from 'next'
import { getMessages } from 'next-intl/server'

import { LegalDocPage, legalDocMetadata } from '@/components/legal/LegalDocPage'
import { SUBPROCESSORS } from '@/lib/legal/subprocessors'
import type { AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  return legalDocMetadata((await params).locale, 'subprocessors')
}

export default async function SubprocessorsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const messages = (await getMessages({ locale })) as unknown as Messages
  const headers = messages.Legal.subprocessors.tableHeaders
  const optional = messages.Legal.subprocessors.optionalLabel

  return (
    <LegalDocPage locale={locale} docKey="subprocessors">
      <div className="mb-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-foreground">
              <th className="py-2 pr-4 font-semibold">{headers.name}</th>
              <th className="py-2 pr-4 font-semibold">{headers.purpose}</th>
              <th className="py-2 pr-4 font-semibold">{headers.data}</th>
              <th className="py-2 font-semibold">{headers.location}</th>
            </tr>
          </thead>
          <tbody className="align-top text-muted-foreground">
            {SUBPROCESSORS.map((sp) => (
              <tr key={sp.name} className="border-b border-border">
                <td className="py-3 pr-4 font-medium text-foreground">{sp.name}</td>
                <td className="py-3 pr-4">
                  {sp.purpose[locale]}
                  {sp.consent ? <span className="block text-xs">{optional}</span> : null}
                </td>
                <td className="py-3 pr-4">{sp.data[locale]}</td>
                <td className="py-3">{sp.location[locale]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LegalDocPage>
  )
}
