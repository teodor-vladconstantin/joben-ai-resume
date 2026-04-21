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
  if (!resetAt) return 'luna urmatoare'

  try {
    const parsed = new Date(resetAt)
    return parsed.toLocaleString('ro-RO', { month: 'long', timeZone: 'UTC' })
  } catch {
    return 'luna urmatoare'
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

  let tooltip = title || ''
  if (blocked) {
    tooltip = 'Acces suspendat. Contacteaza suportul.'
  } else if (exhausted) {
    tooltip = `Limita lunara atinsa. Resetare pe 1 ${getNextMonthLabel(status?.resetAt)}.`
  } else if (tokenExhausted) {
    tooltip = 'Creditul AI lunar a fost epuizat.'
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
    </button>
  )
}
