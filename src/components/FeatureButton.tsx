'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import type { Feature } from '@/lib/ratelimit'
import { useRateLimitStatus } from '@/hooks/useRateLimitStatus'

interface FeatureButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  feature: Feature
  onClick: () => void | Promise<void>
  children: ReactNode
}

function getNextMonthLabel(resetAt?: string): string {
  if (!resetAt) return 'next month'

  try {
    const parsed = new Date(resetAt)
    return parsed.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  } catch {
    return 'next month'
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
    tooltip = 'Access suspended. Please contact support.'
  } else if (exhausted) {
    tooltip = `Monthly limit reached. Resets on the 1st of ${getNextMonthLabel(status?.resetAt)}.`
  } else if (tokenExhausted) {
    tooltip = 'Monthly AI credit has been used up.'
  } else if (showRemainingCount) {
    tooltip = title || `${featureStatus.remaining} of ${featureStatus.limit} left this month`
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
