import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { safeEqual } from '@/lib/cron-utils'
import {
  type SocialLead,
  generateHelpfulResponseDraft,
  sendTelegramNotification,
  sendDiscordNotification,
} from '@/lib/social-listening'

export const runtime = 'nodejs'

const socialLeadSchema = z.object({
  source: z.enum(['reddit', 'linkedin', 'twitter', 'facebook', 'other']).default('reddit'),
  platformUrl: z.string().url(),
  author: z.string().min(1).max(100),
  subredditOrGroup: z.string().max(100).optional(),
  title: z.string().min(1).max(300),
  body: z.string().max(5000).default(''),
  matchedKeywords: z.array(z.string()).default([]),
  relevanceScore: z.number().min(0).max(100).optional(),
  suggestedResponse: z.string().max(2000).optional(),
})

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    // 1. Security Authorization check
    const authHeader = req.headers.get('authorization')
    const secretHeader = req.headers.get('x-webhook-secret')
    const configuredSecret = process.env.SOCIAL_LISTENING_WEBHOOK_SECRET

    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const providedSecret = bearerToken || secretHeader

    // Fail closed when the secret is not configured.
    if (!configuredSecret || !providedSecret || !safeEqual(providedSecret, configuredSecret)) {
      logger.warn('Unauthorized social listening webhook attempt', {
        requestId,
        hasAuthHeader: Boolean(authHeader),
        hasSecretHeader: Boolean(secretHeader),
      })
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    // 2. Parse & validate payload
    const body = await req.json().catch(() => null)
    const parsed = socialLeadSchema.safeParse(body)
    if (!parsed.success) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Date de intrare invalide.') },
        400,
        requestId
      )
    }

    const lead: SocialLead = {
      ...parsed.data,
      suggestedResponse:
        parsed.data.suggestedResponse || generateHelpfulResponseDraft(parsed.data as SocialLead),
    }

    // 3. Persist lead in database
    const supabase = createServerClient()
    const { data: inserted, error: insertError } = await supabase
      .from('social_leads')
      .insert({
        source: lead.source,
        platform_url: lead.platformUrl,
        author: lead.author,
        title: lead.title,
        body: lead.body,
        matched_keywords: lead.matchedKeywords,
        relevance_score: lead.relevanceScore ?? 80,
        suggested_response: lead.suggestedResponse,
        status: 'pending',
      })
      .select('id')
      .maybeSingle()

    if (insertError) {
      logger.error('Failed to store social lead in database', {
        requestId,
        error: insertError.message,
      })
    }

    lead.id = inserted?.id

    // 4. Dispatch Telegram and Discord notifications in parallel
    const [telegramSent, discordSent] = await Promise.all([
      sendTelegramNotification(lead),
      sendDiscordNotification(lead),
    ])

    logger.info('Social listening lead processed and dispatched', {
      requestId,
      leadId: lead.id,
      platform: lead.source,
      author: lead.author,
      telegramSent,
      discordSent,
    })

    return jsonWithRequestId(
      {
        success: true,
        leadId: lead.id,
        telegramDispatched: telegramSent,
        discordDispatched: discordSent,
        suggestedResponse: lead.suggestedResponse,
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Social listening webhook failure', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
