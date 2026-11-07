'use client'

import { useTranslations } from 'next-intl'

// Transparency note (AI Act art. 50 information duty, Privacy Policy section 3):
// shown next to AI-generated scores and rewrites.
export function AiNotice({ className }: { className?: string }) {
  const t = useTranslations('AiNotice')
  return <p className={className ?? 'mb-4 text-xs text-muted-foreground'}>{t('text')}</p>
}
