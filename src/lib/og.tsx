import { ImageResponse } from 'next/og'
import { getGuide, type GuideKind } from '@/data/guides'
import { resumeRoles } from '@/data/resume-roles'
import { findSeoJob } from '@/data/seo-jobs'

import type { AppLocale } from '@/i18n/routing'

export const OG_SIZE = { width: 1200, height: 630 }

function card(label: string, title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0c121d',
          color: '#ecfdf5',
          padding: 72,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 700 }}>
          <span>Joben</span>
          <span style={{ fontSize: 24, color: '#a1a1aa' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 60 ? 54 : 66, fontWeight: 800, lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#a1a1aa' }}>joben.eu</div>
      </div>
    ),
    OG_SIZE
  )
}

type Params = { params: Promise<{ locale: AppLocale; slug: string }> }

export const guideOg =
  (kind: GuideKind, label: Record<AppLocale, string>) =>
  async ({ params }: Params) => {
    const { locale, slug } = await params
    const guide = getGuide(locale, slug, kind)
    return card(label[locale], guide?.content[locale].title ?? 'Joben')
  }

export const roleOg = async ({ params }: Params) => {
  const { locale, slug } = await params
  const role = resumeRoles.find((r) => r.slug[locale] === slug)
  const title = role ? (locale === 'ro' ? `Model CV ${role.title.ro}` : `${role.title.en} Resume Example`) : 'Joben'
  return card(locale === 'ro' ? 'Exemple CV' : 'Resume examples', title)
}

export const coverLetterOg = async ({ params }: Params) => {
  const { locale, slug } = await params
  const job = findSeoJob(locale, slug)
  const title = job
    ? locale === 'ro'
      ? `Scrisoare de intenție ${job.title.ro}`
      : `${job.title.en} Cover Letter Example`
    : 'Joben'
  return card(locale === 'ro' ? 'Scrisori de intenție' : 'Cover letters', title)
}
