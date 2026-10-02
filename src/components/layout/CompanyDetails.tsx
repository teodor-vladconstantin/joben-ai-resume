import { getTranslations } from 'next-intl/server'

import { company } from '@/lib/content'

export async function CompanyDetails({ className }: { className?: string }) {
  const t = await getTranslations('Footer')

  return <p className={className}>{t('companyLine', company)}</p>
}
