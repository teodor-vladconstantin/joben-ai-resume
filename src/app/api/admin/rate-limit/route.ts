import { auth } from '@clerk/nextjs/server'
import {
  blockFeature,
  Feature,
  FlagType,
  getRateLimitStatus,
  getRedisClient,
  unblockFeature,
} from '@/lib/ratelimit'
import { getRequestId, jsonWithRequestId } from '@/lib/logger'
import { getErrorMessage } from '@/lib/api-response'

const FEATURE_SET = new Set<Feature>(['covers', 'jds', 'bullets', 'reviews', 'summaries', 'cvs'])
const FLAG_SET = new Set<FlagType>(['covers', 'jds', 'bullets', 'reviews', 'summaries', 'cvs', 'tokens', 'hard_cap'])

function parseAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS || ''
  const ids = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return new Set(ids)
}

function isValidIsoDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
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

async function scanAllKeys(match: string): Promise<string[]> {
  const redis = getRedisClient()
  if (!redis) {
    return []
  }

  const keys: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, batch] = await redis.scan(cursor, {
      match,
      count: 200,
    })

    if (Array.isArray(batch) && batch.length > 0) {
      keys.push(...batch)
    }

    cursor = nextCursor
  } while (cursor !== '0')

  return keys
}

async function getAlertsForDate(date: string): Promise<Array<{ userId: string; flagType: FlagType; hits: number; date: string }>> {
  const redis = getRedisClient()
  if (!redis) {
    return []
  }

  const prefix = `admin:alerts:${date}:`
  const keys = await scanAllKeys(`${prefix}*`)

  if (keys.length === 0) {
    return []
  }

  const pipeline = redis.pipeline()
  for (const key of keys) {
    pipeline.get(key)
  }

  const values = (await pipeline.exec()) as unknown[]
  const alerts: Array<{ userId: string; flagType: FlagType; hits: number; date: string }> = []

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]
    const rawValue = values[index]
    const hits = toCounter(rawValue)

    const suffix = key.startsWith(prefix) ? key.slice(prefix.length) : ''
    const parts = suffix.split(':')
    if (parts.length < 2) {
      continue
    }

    const userId = parts[0]
    const flagTypeValue = parts.slice(1).join(':')

    if (!FLAG_SET.has(flagTypeValue as FlagType)) {
      continue
    }

    alerts.push({
      userId,
      flagType: flagTypeValue as FlagType,
      hits,
      date,
    })
  }

  return alerts.sort((a, b) => b.hits - a.hits)
}

export async function GET(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()

    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const admins = parseAdminUserIds()
    if (!admins.has(userId)) {
      return jsonWithRequestId({ error: 'Forbidden' }, 403, requestId)
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action') || 'alerts'

    if (action === 'alerts') {
      const today = new Date().toISOString().slice(0, 10)
      const date = searchParams.get('date') || today

      if (!isValidIsoDay(date)) {
        return jsonWithRequestId({ error: 'date must use YYYY-MM-DD format' }, 400, requestId)
      }

      const alerts = await getAlertsForDate(date)
      return jsonWithRequestId(alerts, 200, requestId)
    }

    if (action === 'user') {
      const targetUserId = searchParams.get('userId')
      if (!targetUserId) {
        return jsonWithRequestId({ error: 'userId is required for action=user' }, 400, requestId)
      }

      const status = await getRateLimitStatus(targetUserId)
      return jsonWithRequestId(status, 200, requestId)
    }

    return jsonWithRequestId({ error: 'Unsupported action. Use alerts or user.' }, 400, requestId)
  } catch (error) {
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()

    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const admins = parseAdminUserIds()
    if (!admins.has(userId)) {
      return jsonWithRequestId({ error: 'Forbidden' }, 403, requestId)
    }

    const body = (await req.json()) as {
      action?: 'block' | 'unblock'
      userId?: string
      feature?: Feature
    }

    if (!body.action || (body.action !== 'block' && body.action !== 'unblock')) {
      return jsonWithRequestId({ error: 'action must be block or unblock' }, 400, requestId)
    }

    if (!body.userId) {
      return jsonWithRequestId({ error: 'userId is required' }, 400, requestId)
    }

    if (!body.feature || !FEATURE_SET.has(body.feature)) {
      return jsonWithRequestId({ error: 'feature must be one of covers, jds, bullets, reviews, summaries, cvs' }, 400, requestId)
    }

    if (body.action === 'block') {
      await blockFeature(body.userId, body.feature)
    } else {
      await unblockFeature(body.userId, body.feature)
    }

    return jsonWithRequestId(
      {
        ok: true,
        action: body.action,
        userId: body.userId,
        feature: body.feature,
      },
      200,
      requestId
    )
  } catch (error) {
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}
