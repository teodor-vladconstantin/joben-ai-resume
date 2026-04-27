'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Feature, RateLimitStatus } from '@/lib/ratelimit'

interface UseRateLimitStatusResult {
  status: RateLimitStatus | null
  loading: boolean
  refetch: () => Promise<void>
  isFeatureBlocked: (feature: Feature) => boolean
  isFeatureExhausted: (feature: Feature) => boolean
  isTokenBudgetExhausted: () => boolean
}

export function useRateLimitStatus(): UseRateLimitStatusResult {
  const [status, setStatus] = useState<RateLimitStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/rate-limit-status', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'Could not load rate limit status.')
      }

      const payload = (await response.json()) as RateLimitStatus & { data?: RateLimitStatus }
      setStatus(payload.data || payload)
    } catch {
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const isFeatureBlocked = useCallback(
    (feature: Feature) => {
      return Boolean(status?.features?.[feature]?.blocked)
    },
    [status]
  )

  const isFeatureExhausted = useCallback(
    (feature: Feature) => {
      const featureStatus = status?.features?.[feature]
      if (!featureStatus) return false
      if (featureStatus.blocked) return true
      if (featureStatus.remaining === null) return false
      return featureStatus.remaining <= 0
    },
    [status]
  )

  const isTokenBudgetExhausted = useCallback(() => {
    const tokenStatus = status?.tokens
    if (!tokenStatus) return false

    const tokenBudgetExhausted = tokenStatus.remaining !== null && tokenStatus.remaining <= 0
    const hardCapExhausted = tokenStatus.hardCapUsed >= tokenStatus.hardCap

    return tokenBudgetExhausted || hardCapExhausted
  }, [status])

  const result = useMemo<UseRateLimitStatusResult>(
    () => ({
      status,
      loading,
      refetch,
      isFeatureBlocked,
      isFeatureExhausted,
      isTokenBudgetExhausted,
    }),
    [status, loading, refetch, isFeatureBlocked, isFeatureExhausted, isTokenBudgetExhausted]
  )

  return result
}
