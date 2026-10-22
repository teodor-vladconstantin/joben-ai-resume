import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { isAuthorizedCronRequest } from '@/lib/cron-utils'
import { RETENTION_RULES, retentionCutoff } from '@/lib/data-retention'

export const runtime = 'nodejs'

// Enforces the retention windows stated in the Privacy Policy. Scheduled by
// .github/workflows/data-retention-cron.yml (Vercel Hobby cron slots are full).
export async function POST(request: Request) {
  const requestId = getRequestId(request)

  if (!isAuthorizedCronRequest(request)) {
    logger.warn('Data retention cron request rejected: missing or invalid CRON_SECRET', {
      requestId,
      route: '/api/cron/data-retention',
    })
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const supabase = createServerClient()
  const deleted: Record<string, number> = {}
  const failed: string[] = []

  for (const rule of RETENTION_RULES) {
    let query = supabase
      .from(rule.table)
      .delete({ count: 'exact' })
      .lt('created_at', retentionCutoff(rule.days))
    if (rule.unownedColumn) query = query.is(rule.unownedColumn, null)

    const { count, error } = await query
    if (error) {
      failed.push(rule.table)
      logger.error('Data retention delete failed', {
        requestId,
        route: '/api/cron/data-retention',
        table: rule.table,
        error: error.message,
      })
      continue
    }
    deleted[rule.table] = count ?? 0
  }

  return jsonWithRequestId({ ok: failed.length === 0, deleted, failed }, failed.length === 0 ? 200 : 500, requestId)
}

export const GET = POST
