import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'
import type { UserPlan } from '@/lib/plans'

export type RateLimitedApiRoute = 'analyze' | 'tailor' | 'improve-bullet' | 'cover-letter'

type PlanRateLimits = Record<UserPlan, number | null>

type RateLimitWindow = {
  period: 'daily' | 'monthly'
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`
  byPlan: PlanRateLimits
  message: string
}

type RateLimitDefinition = {
  windows: RateLimitWindow[]
}

const RATE_LIMITS: Record<RateLimitedApiRoute, RateLimitDefinition> = {
  analyze: {
    windows: [
      {
        period: 'daily',
        window: '1 d',
        byPlan: {
          free: null,
          pro: 5,
          recruiting: null,
        },
        message: 'Daily resume analysis limit reached for your plan. Upgrade to continue.',
      },
      {
        period: 'monthly',
        window: '30 d',
        byPlan: {
          free: null,
          pro: 30,
          recruiting: null,
        },
        message: 'Monthly resume analysis limit reached for your plan. Upgrade to continue.',
      },
    ],
  },
  tailor: {
    windows: [
      {
        period: 'daily',
        window: '1 d',
        byPlan: {
          free: null,
          pro: 5,
          recruiting: null,
        },
        message: 'Daily resume tailoring limit reached for your plan. Upgrade to continue.',
      },
      {
        period: 'monthly',
        window: '30 d',
        byPlan: {
          free: null,
          pro: 30,
          recruiting: null,
        },
        message: 'Monthly resume tailoring limit reached for your plan. Upgrade to continue.',
      },
    ],
  },
  'improve-bullet': {
    windows: [
      {
        period: 'daily',
        window: '1 d',
        byPlan: {
          free: 2,
          pro: 10,
          recruiting: null,
        },
        message: 'Daily bullet rewrite limit reached for your plan. Upgrade to continue.',
      },
      {
        period: 'monthly',
        window: '30 d',
        byPlan: {
          free: 30,
          pro: 150,
          recruiting: null,
        },
        message: 'Monthly bullet rewrite limit reached for your plan. Upgrade to continue.',
      },
    ],
  },
  'cover-letter': {
    windows: [
      {
        period: 'daily',
        window: '1 d',
        byPlan: {
          free: null,
          pro: 3,
          recruiting: null,
        },
        message: 'Daily cover letter limit reached for your plan. Upgrade to continue.',
      },
      {
        period: 'monthly',
        window: '30 d',
        byPlan: {
          free: null,
          pro: 20,
          recruiting: null,
        },
        message: 'Monthly cover letter limit reached for your plan. Upgrade to continue.',
      },
    ],
  },
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

const limiterCache = new Map<string, Ratelimit>()
let warnedMissingConfig = false

function getLimiter(
  route: RateLimitedApiRoute,
  plan: UserPlan,
  limit: number,
  window: RateLimitWindow['window'],
  period: RateLimitWindow['period']
): Ratelimit {
  const cacheKey = `${route}:${plan}:${period}:${limit}:${window}`
  const existing = limiterCache.get(cacheKey)
  if (existing) {
    return existing
  }

  if (!redis) {
    throw new Error('Upstash Redis is not configured')
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
  })
  limiterCache.set(cacheKey, limiter)
  return limiter
}

export type ApiRateLimitResult = {
  allowed: boolean
  status: number
  error?: string
  period?: 'daily' | 'monthly'
  limit?: number
  remaining?: number
  resetAt?: number
  showUpgrade?: boolean
}

export async function enforceApiRateLimit(params: {
  route: RateLimitedApiRoute
  userId: string
  plan: UserPlan
}): Promise<ApiRateLimitResult> {
  const routeConfig = RATE_LIMITS[params.route]
  const unavailableMessage = 'Rate limiting service is temporarily unavailable. Please try again in a moment.'

  if (!redis) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true
      logger.error('Upstash rate limits unavailable because Redis config is missing; blocking request', {
        source: 'enforceApiRateLimit',
      })
    }

    return {
      allowed: false,
      status: 503,
      error: unavailableMessage,
      showUpgrade: false,
    }
  }

  try {
    for (const windowConfig of routeConfig.windows) {
      const limit = windowConfig.byPlan[params.plan]
      if (limit === null) {
        continue
      }

      const limiter = getLimiter(
        params.route,
        params.plan,
        limit,
        windowConfig.window,
        windowConfig.period
      )
      const result = await limiter.limit(`${windowConfig.period}:${params.route}:${params.userId}`)

      if (!result.success) {
        return {
          allowed: false,
          status: 429,
          error: windowConfig.message,
          period: windowConfig.period,
          limit,
          remaining: result.remaining,
          resetAt: result.reset,
          showUpgrade: params.plan !== 'recruiting',
        }
      }
    }

    return {
      allowed: true,
      status: 200,
    }
  } catch (error) {
    logger.error('Rate limit check failed; blocking request', {
      source: 'enforceApiRateLimit',
      route: params.route,
      plan: params.plan,
      userId: params.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      allowed: false,
      status: 503,
      error: unavailableMessage,
      showUpgrade: false,
    }
  }
}
