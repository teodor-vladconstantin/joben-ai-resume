import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const analyzeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 d'),
})

export const coverLetterRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '1 d'),
})
