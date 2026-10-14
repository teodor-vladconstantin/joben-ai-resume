"use client"

import { useEffect, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import { Check, Copy, ExternalLink, Gift, Loader2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'
import {
  MAX_REWARDED_REFERRALS_PER_30D,
  MAX_REWARDED_REFERRALS_TOTAL,
  REFERRED_REWARD_DAYS,
  REFERRER_REWARD_DAYS,
} from '@/lib/referral-shared'

interface ReferralInfo {
  referralCount: number
  referralCredits: number
  referralLink: string
  proExpiresAt: string | null
}

type ReferralResponse = Partial<ReferralInfo> & { success?: boolean; pending?: boolean }

type CardState =
  | { kind: 'loading' }
  | { kind: 'pending' }
  | { kind: 'error' }
  | { kind: 'ready'; info: ReferralInfo; proUntil: Date | null }

// Right after sign-up the Clerk webhook may not have created the users row
// yet (API answers {pending:true}): retry a couple of times, then say so.
const RETRY_DELAYS_MS = [2000, 5000]

export function ReferralCard({ className = '' }: { className?: string }) {
  const t = useTranslations('Referral')
  const format = useFormatter()
  const [state, setState] = useState<CardState>({ kind: 'loading' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async (attempt: number): Promise<void> => {
      let json: ReferralResponse | null = null
      try {
        const res = await fetch('/api/referral')
        json = res.ok ? ((await res.json()) as ReferralResponse) : null
      } catch {
        json = null
      }
      if (cancelled) return

      if (json?.pending) {
        if (attempt < RETRY_DELAYS_MS.length) {
          timer = setTimeout(() => void load(attempt + 1), RETRY_DELAYS_MS[attempt])
        } else {
          setState({ kind: 'pending' })
        }
        return
      }
      if (!json?.success || !json.referralLink) {
        setState({ kind: 'error' })
        return
      }

      const info: ReferralInfo = {
        referralCount: json.referralCount ?? 0,
        referralCredits: json.referralCredits ?? 0,
        referralLink: json.referralLink,
        proExpiresAt: json.proExpiresAt ?? null,
      }
      const expiry = info.proExpiresAt ? new Date(info.proExpiresAt) : null
      const proUntil = expiry && expiry.getTime() > Date.now() ? expiry : null
      setState({ kind: 'ready', info, proUntil })
    }

    void load(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const boxClass = `bg-(--surface) p-6 border border-(--border) ${className}`

  if (state.kind === 'error') return null

  if (state.kind === 'loading') {
    return (
      <div className={`${boxClass} flex justify-center`} role="status" aria-label={t('loading')}>
        <Loader2 className="h-5 w-5 animate-spin text-(--muted)" />
      </div>
    )
  }

  if (state.kind === 'pending') {
    return (
      <div className={boxClass}>
        <h3 className="text-lg font-bold text-(--foreground) mb-2">{t('title')}</h3>
        <p className="text-sm text-(--muted)">{t('pending')}</p>
      </div>
    )
  }

  const { info, proUntil } = state
  const encodedUrl = encodeURIComponent(info.referralLink)
  const shareText = encodeURIComponent(t('shareText', { friendDays: REFERRED_REWARD_DAYS }))
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  function handleCopy() {
    navigator.clipboard
      .writeText(info.referralLink)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
      .catch(() => undefined)
  }

  return (
    <section className={`${boxClass} space-y-5`} aria-labelledby="referral-card-title">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 mt-1 shrink-0 text-(--accent)" aria-hidden="true" />
          <div className="space-y-1">
            <h3 id="referral-card-title" className="text-lg font-bold text-(--foreground)">{t('title')}</h3>
            <p className="text-sm text-(--muted)">
              {t('description', { referrerDays: REFERRER_REWARD_DAYS, friendDays: REFERRED_REWARD_DAYS })}
            </p>
            <p className="text-xs text-(--muted)">
              {t('conditions', {
                maxTotal: MAX_REWARDED_REFERRALS_TOTAL,
                maxMonthly: MAX_REWARDED_REFERRALS_PER_30D,
                friendDays: REFERRED_REWARD_DAYS,
              })}
            </p>
          </div>
        </div>

        <dl className="shrink-0 text-left sm:text-right">
          <dt className="text-xs text-(--muted)">{t('invitedLabel')}</dt>
          <dd className="font-mono tabular-nums text-sm font-bold text-(--foreground)">
            {info.referralCount} · {t('daysEarned', { days: info.referralCredits })}
          </dd>
        </dl>
      </div>

      {proUntil ? (
        <p className="text-sm text-(--foreground) border-l-2 border-(--accent) pl-2">
          {t('proUntil', { date: format.dateTime(proUntil, { dateStyle: 'long' }) })}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="referral-link" className="text-xs font-semibold text-(--foreground)">{t('linkLabel')}</label>
        <div className="flex items-center gap-2">
          <input
            id="referral-link"
            type="text"
            readOnly
            value={info.referralLink}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full px-3 py-2 text-xs font-mono border border-(--border) bg-(--surface-elevated) text-(--foreground) focus:outline-none focus:border-(--accent)"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 ${buttonVariants('primary', 'sm')} text-xs font-semibold inline-flex items-center gap-1.5`}
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            <span aria-live="polite">{copied ? t('copied') : t('copy')}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-(--border)">
        <span className="text-xs text-(--muted) mr-1">{t('shareLabel')}</span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonVariants('secondary', 'sm')} text-xs inline-flex items-center gap-1.5`}
        >
          WhatsApp
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonVariants('secondary', 'sm')} text-xs inline-flex items-center gap-1.5`}
        >
          LinkedIn
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
