import { Redis } from '@upstash/redis'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type Plan = 'free' | 'pro' | 'recruiting'
export type Feature = 'covers' | 'jds' | 'bullets' | 'cvs'
export type FlagType = Feature | 'tokens' | 'hard_cap'

export interface PlanLimits {
  tokenBudget: number | null
  hardCapTokens: number
  maxInputTokensPerCall: number
  maxOutputTokensPerCall: number
  maxRawChars: number
  covers: number | null
  jds: number | null
  bullets: number | null
  cvs: number | null
}

export interface FeatureStatus {
  used: number
  limit: number | null
  remaining: number | null
  blocked: boolean
}

export interface FlagStatus {
  hits: number
  flagged: boolean
}

export interface RateLimitStatus {
  plan: Plan
  tokens: {
    used: number
    limit: number | null
    remaining: number | null
    hardCap: number
    hardCapUsed: number
  }
  features: Record<Feature, FeatureStatus>
  flags: Record<FlagType, FlagStatus>
  resetAt: string
}

const MONTHLY_TTL_SECONDS = 35 * 24 * 60 * 60
const ADMIN_ALERT_TTL_SECONDS = 90 * 24 * 60 * 60
const PLAN_CACHE_TTL_SECONDS = 60 * 60

const FEATURE_ORDER: Feature[] = ['covers', 'jds', 'bullets', 'cvs']
const FLAG_ORDER: FlagType[] = ['covers', 'jds', 'bullets', 'cvs', 'tokens', 'hard_cap']

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    tokenBudget: 80_000,
    hardCapTokens: 1_500_000,
    maxInputTokensPerCall: 8_000,
    maxOutputTokensPerCall: 2_000,
    maxRawChars: 32_000,
    covers: 3,
    jds: 3,
    bullets: 15,
    cvs: 1,
  },
  pro: {
    tokenBudget: 600_000,
    hardCapTokens: 1_500_000,
    maxInputTokensPerCall: 8_000,
    maxOutputTokensPerCall: 2_000,
    maxRawChars: 32_000,
    covers: 60,
    jds: 60,
    bullets: 200,
    cvs: 3,
  },
  recruiting: {
    tokenBudget: 3_000_000,
    hardCapTokens: 7_500_000,
    maxInputTokensPerCall: 8_000,
    maxOutputTokensPerCall: 2_000,
    maxRawChars: 32_000,
    covers: 300,
    jds: 300,
    bullets: 1_000,
    cvs: 15,
  },
}

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

function normalizePlan(input: string | null | undefined): Plan | null {
  if (input === 'free' || input === 'pro' || input === 'recruiting') {
    return input
  }
  return null
}

function currentMonthUtc(date = new Date()): string {
  return date.toISOString().slice(0, 7)
}

function currentDayUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function getMonthlyResetAtIso(date = new Date()): string {
  const resetAt = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0))
  return resetAt.toISOString().replace('.000Z', 'Z')
}

function tokenKey(userId: string, month: string): string {
  return `tokens:${userId}:${month}`
}

function featureKey(userId: string, feature: Feature, month: string): string {
  if (feature === 'cvs') {
    return `features:${userId}:cvs`
  }
  return `features:${userId}:${month}:${feature}`
}

function flagKey(userId: string, flagType: FlagType, month: string): string {
  return `flags:${userId}:${month}:${flagType}:hits`
}

function blockedKey(userId: string, feature: Feature): string {
  return `blocked:${userId}:${feature}`
}

function toCounter(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed))
    }
  }

  return 0
}

function isBlockedValue(value: unknown): boolean {
  return value === '1' || value === 1 || value === true
}

function logRedisFailure(message: string, context?: Record<string, unknown>) {
  logger.warn(message, {
    source: 'ratelimit',
    ...(context || {}),
  })
}

function createDefaultFeatureStatuses(limits: PlanLimits): Record<Feature, FeatureStatus> {
  return {
    covers: { used: 0, limit: limits.covers, remaining: limits.covers, blocked: false },
    jds: { used: 0, limit: limits.jds, remaining: limits.jds, blocked: false },
    bullets: { used: 0, limit: limits.bullets, remaining: limits.bullets, blocked: false },
    cvs: { used: 0, limit: limits.cvs, remaining: limits.cvs, blocked: false },
  }
}

function createDefaultFlagStatuses(): Record<FlagType, FlagStatus> {
  return {
    covers: { hits: 0, flagged: false },
    jds: { hits: 0, flagged: false },
    bullets: { hits: 0, flagged: false },
    cvs: { hits: 0, flagged: false },
    tokens: { hits: 0, flagged: false },
    hard_cap: { hits: 0, flagged: false },
  }
}

function buildFallbackStatus(plan: Plan, limits: PlanLimits): RateLimitStatus {
  return {
    plan,
    tokens: {
      used: 0,
      limit: limits.tokenBudget,
      remaining: limits.tokenBudget,
      hardCap: limits.hardCapTokens,
      hardCapUsed: 0,
    },
    features: createDefaultFeatureStatuses(limits),
    flags: createDefaultFlagStatuses(),
    resetAt: getMonthlyResetAtIso(),
  }
}

function getFeatureLimitValue(limits: PlanLimits, feature: Feature): number | null {
  return limits[feature]
}

export function getRedisClient(): Redis | null {
  return redis
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const planCacheKey = `plan:${userId}`

  if (redis) {
    try {
      const cached = await redis.get<string>(planCacheKey)
      const cachedPlan = normalizePlan(cached)
      if (cachedPlan) {
        return cachedPlan
      }
    } catch (error) {
      logRedisFailure('Could not read plan from Redis cache; falling back to DB', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('plan, lifetime_recruiting_unlocked')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (error) {
      logger.warn('Could not read user plan from DB; defaulting to free', {
        source: 'ratelimit.getUserPlan',
        userId,
        error: error.message,
      })
      return 'free'
    }

    const resolvedPlan = data?.lifetime_recruiting_unlocked
      ? 'recruiting'
      : normalizePlan((data?.plan as string | undefined) || null) || 'free'

    if (redis) {
      try {
        await redis.setex(planCacheKey, PLAN_CACHE_TTL_SECONDS, resolvedPlan)
      } catch (error) {
        logRedisFailure('Could not write plan cache to Redis', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return resolvedPlan
  } catch (error) {
    logger.warn('Unexpected plan resolution failure; defaulting to free', {
      source: 'ratelimit.getUserPlan',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return 'free'
  }
}

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export async function checkAndReserveTokens(
  userId: string,
  plan: Plan,
  estimatedInputTokens: number
): Promise<{ allowed: boolean; reason?: string; limitType?: 'tokens' | 'hard_cap' }> {
  if (!redis) {
    return { allowed: true }
  }

  const limits = getPlanLimits(plan)
  const month = currentMonthUtc()
  const key = tokenKey(userId, month)
  const estimated = Math.max(0, Math.floor(estimatedInputTokens))

  try {
    const pipeline = redis.pipeline()
    pipeline.get(key)
    const result = (await pipeline.exec()) as unknown[]
    const used = toCounter(result[0])
    const projected = used + estimated

    if (projected > limits.hardCapTokens) {
      return {
        allowed: false,
        reason: 'Hard cap exceeded',
        limitType: 'hard_cap',
      }
    }

    if (limits.tokenBudget !== null && projected > limits.tokenBudget) {
      return {
        allowed: false,
        reason: 'Token budget exceeded',
        limitType: 'tokens',
      }
    }

    return { allowed: true }
  } catch (error) {
    logRedisFailure('Token reserve check failed; allowing request (fail-open)', {
      userId,
      plan,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { allowed: true }
  }
}

export async function recordTokenUsage(userId: string, inputTokens: number, outputTokens: number): Promise<void> {
  if (!redis) return

  const total = Math.max(0, Math.floor(inputTokens)) + Math.max(0, Math.floor(outputTokens))
  if (total <= 0) return

  const month = currentMonthUtc()
  const key = tokenKey(userId, month)

  try {
    const pipeline = redis.pipeline()
    pipeline.incrby(key, total)
    pipeline.expire(key, MONTHLY_TTL_SECONDS)
    await pipeline.exec()
  } catch (error) {
    logRedisFailure('Failed to record token usage (fail-open)', {
      userId,
      total,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function checkFeatureLimit(
  userId: string,
  feature: Feature,
  plan: Plan
): Promise<{ allowed: boolean; used: number; limit: number | null; blocked: boolean }> {
  const limits = getPlanLimits(plan)
  const limit = getFeatureLimitValue(limits, feature)

  if (!redis) {
    return {
      allowed: true,
      used: 0,
      limit,
      blocked: false,
    }
  }

  const month = currentMonthUtc()
  const featureCounterKey = featureKey(userId, feature, month)
  const featureBlockedKey = blockedKey(userId, feature)

  try {
    const pipeline = redis.pipeline()
    pipeline.get(featureBlockedKey)
    pipeline.get(featureCounterKey)

    const result = (await pipeline.exec()) as unknown[]
    const blocked = isBlockedValue(result[0])
    const used = toCounter(result[1])

    if (blocked) {
      return {
        allowed: false,
        used,
        limit,
        blocked: true,
      }
    }

    if (limit === null) {
      return {
        allowed: true,
        used,
        limit,
        blocked: false,
      }
    }

    return {
      allowed: used < limit,
      used,
      limit,
      blocked: false,
    }
  } catch (error) {
    logRedisFailure('Feature limit check failed; allowing request (fail-open)', {
      userId,
      feature,
      plan,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      allowed: true,
      used: 0,
      limit,
      blocked: false,
    }
  }
}

export async function incrementFeatureCounter(userId: string, feature: Feature): Promise<void> {
  if (!redis) return

  const month = currentMonthUtc()
  const key = featureKey(userId, feature, month)

  try {
    if (feature === 'cvs') {
      await redis.incr(key)
      return
    }

    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, MONTHLY_TTL_SECONDS)
    await pipeline.exec()
  } catch (error) {
    logRedisFailure('Failed to increment feature counter (fail-open)', {
      userId,
      feature,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function recordLimitHit(userId: string, flagType: FlagType): Promise<void> {
  if (!redis) return

  const month = currentMonthUtc()
  const key = flagKey(userId, flagType, month)

  try {
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, MONTHLY_TTL_SECONDS)

    const result = (await pipeline.exec()) as unknown[]
    const hits = toCounter(result[0])

    if (hits >= 5) {
      void notifyAdmin(userId, flagType, hits)
    }
  } catch (error) {
    logRedisFailure('Failed to record limit hit (fail-open)', {
      userId,
      flagType,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function notifyAdmin(userId: string, flagType: FlagType, hits: number): Promise<void> {
  try {
    if (redis) {
      const date = currentDayUtc()
      const key = `admin:alerts:${date}:${userId}:${flagType}`
      const pipeline = redis.pipeline()
      pipeline.set(key, String(hits))
      pipeline.expire(key, ADMIN_ALERT_TTL_SECONDS)
      await pipeline.exec()
    }
  } catch {
    // Intentionally swallow errors to keep this function non-blocking.
  }

  try {
    console.error(`[ADMIN ALERT] User ${userId} hit ${flagType} limit ${hits} times this month`)
  } catch {
    // Intentionally swallow console transport errors.
  }
}

export async function blockFeature(userId: string, feature: Feature): Promise<void> {
  if (!redis) return

  try {
    await redis.set(blockedKey(userId, feature), '1')
  } catch (error) {
    logRedisFailure('Failed to block feature', {
      userId,
      feature,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function unblockFeature(userId: string, feature: Feature): Promise<void> {
  if (!redis) return

  try {
    await redis.del(blockedKey(userId, feature))
  } catch (error) {
    logRedisFailure('Failed to unblock feature', {
      userId,
      feature,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function getRateLimitStatus(userId: string): Promise<RateLimitStatus> {
  const plan = await getUserPlan(userId)
  const limits = getPlanLimits(plan)
  const fallback = buildFallbackStatus(plan, limits)

  if (!redis) {
    return fallback
  }

  const month = currentMonthUtc()
  const monthlyTokenKey = tokenKey(userId, month)
  const featureCounterKeys = FEATURE_ORDER.map((feature) => featureKey(userId, feature, month))
  const flagCounterKeys = FLAG_ORDER.map((flagType) => flagKey(userId, flagType, month))
  const blockedFeatureKeys = FEATURE_ORDER.map((feature) => blockedKey(userId, feature))

  try {
    const pipeline = redis.pipeline()
    pipeline.get(monthlyTokenKey)
    for (const key of featureCounterKeys) pipeline.get(key)
    for (const key of flagCounterKeys) pipeline.get(key)
    for (const key of blockedFeatureKeys) pipeline.get(key)

    const result = (await pipeline.exec()) as unknown[]
    let cursor = 0

    const usedTokens = toCounter(result[cursor++])

    const featureUsed: Record<Feature, number> = {
      covers: 0,
      jds: 0,
      bullets: 0,
      cvs: 0,
    }

    for (const feature of FEATURE_ORDER) {
      featureUsed[feature] = toCounter(result[cursor++])
    }

    const flagHits: Record<FlagType, number> = {
      covers: 0,
      jds: 0,
      bullets: 0,
      cvs: 0,
      tokens: 0,
      hard_cap: 0,
    }

    for (const flagType of FLAG_ORDER) {
      flagHits[flagType] = toCounter(result[cursor++])
    }

    const blockedFeatures: Record<Feature, boolean> = {
      covers: false,
      jds: false,
      bullets: false,
      cvs: false,
    }

    for (const feature of FEATURE_ORDER) {
      blockedFeatures[feature] = isBlockedValue(result[cursor++])
    }

    const tokenRemaining = limits.tokenBudget === null
      ? null
      : Math.max(limits.tokenBudget - usedTokens, 0)

    const features = FEATURE_ORDER.reduce((acc, feature) => {
      const limit = getFeatureLimitValue(limits, feature)
      const used = featureUsed[feature]

      acc[feature] = {
        used,
        limit,
        remaining: limit === null ? null : Math.max(limit - used, 0),
        blocked: blockedFeatures[feature],
      }

      return acc
    }, {} as Record<Feature, FeatureStatus>)

    const flags = FLAG_ORDER.reduce((acc, flagType) => {
      const hits = flagHits[flagType]
      acc[flagType] = {
        hits,
        flagged: hits >= 5,
      }
      return acc
    }, {} as Record<FlagType, FlagStatus>)

    return {
      plan,
      tokens: {
        used: usedTokens,
        limit: limits.tokenBudget,
        remaining: tokenRemaining,
        hardCap: limits.hardCapTokens,
        hardCapUsed: usedTokens,
      },
      features,
      flags,
      resetAt: getMonthlyResetAtIso(),
    }
  } catch (error) {
    logRedisFailure('Could not build rate limit status from Redis; returning fallback snapshot', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return fallback
  }
}
