'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { Feature } from '@/lib/ratelimit'
import { useRateLimitStatus } from '@/hooks/useRateLimitStatus'
import type { AppLocale } from '@/i18n/routing'

interface FeatureButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  feature: Feature
  onClick: () => void | Promise<void>
  children: ReactNode
}

function getNextMonthLabel(locale: AppLocale, fallback: string, resetAt?: string): string {
  if (!resetAt) return fallback

  try {
    const parsed = new Date(resetAt)
    return parsed.toLocaleString(locale === 'ro' ? 'ro-RO' : 'en-US', { month: 'long', timeZone: 'UTC' })
  } catch {
    return fallback
  }
}

export function FeatureButton({
  feature,
  onClick,
  children,
  className = '',
  disabled = false,
  title,
  ...rest
}: FeatureButtonProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('Shared.featureButton')
  const {
    status,
    isFeatureBlocked,
    isFeatureExhausted,
    isTokenBudgetExhausted,
    refetch,
  } = useRateLimitStatus()

  const blocked = isFeatureBlocked(feature)
  const exhausted = isFeatureExhausted(feature)
  const tokenExhausted = isTokenBudgetExhausted()
  const limited = blocked || exhausted || tokenExhausted
  const finalDisabled = disabled || limited

  const featureStatus = status?.features?.[feature]
  // null limit means unlimited on the user's plan; nothing to show.
  const showRemainingCount = !limited && featureStatus && featureStatus.limit !== null

  let tooltip = title || ''
  if (blocked) {
    tooltip = t('accessSuspended')
  } else if (exhausted) {
    tooltip = t('monthlyLimitReached', { month: getNextMonthLabel(locale, t('nextMonth'), status?.resetAt) })
  } else if (tokenExhausted) {
    tooltip = t('creditUsedUp')
  } else if (showRemainingCount && featureStatus.limit !== null && featureStatus.remaining !== null) {
    tooltip = title || t('remainingThisMonth', { remaining: featureStatus.remaining, limit: featureStatus.limit })
  }

  const handleClick = async () => {
    if (finalDisabled) return
    await onClick()
    void refetch()
  }

  const disabledClasses = finalDisabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={finalDisabled}
      title={tooltip || undefined}
      className={`inline-flex items-center justify-center gap-2 transition-opacity ${disabledClasses} ${className}`.trim()}
      {...rest}
    >
      {limited ? <Lock size={14} aria-hidden="true" /> : null}
      {children}
      {showRemainingCount ? (
        <span className="text-xs font-normal opacity-70">
          ({featureStatus.remaining}/{featureStatus.limit})
        </span>
      ) : null}
    </button>
  )
}
