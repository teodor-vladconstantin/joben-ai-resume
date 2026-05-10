import Anthropic from '@anthropic-ai/sdk'
import {
  checkAndReserveTokens,
  checkFeatureLimit,
  getMonthlyResetAtIso,
  getPlanLimits,
  getRateLimitStatus,
  incrementFeatureCounter,
  Plan,
  recordLimitHit,
  recordTokenUsage,
  Feature,
} from '@/lib/ratelimit'
import { sanitizeAiError } from '@/lib/ai-errors'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const primaryClaudeModel = 'claude-haiku-4-5-20251001'
const fallbackClaudeModel = 'claude-3-haiku-20240307'
const defaultClaudeModel = process.env.ANTHROPIC_MODEL || primaryClaudeModel

const FEATURE_LABEL: Record<Feature, string> = {
  covers: 'cover letters',
  jds: 'job tailoring uses',
  bullets: 'bullet rewrites',
  reviews: 'resume analyses',
  summaries: 'summary generations',
  cvs: 'resume creations',
}

export type MessageParam = Anthropic.MessageParam
export type Message = Anthropic.Message

export interface RateLimitError {
  error: string
  limitType: 'tokens' | 'hard_cap' | 'feature' | 'blocked' | 'input_too_long' | 'provider_unavailable'
  feature?: Feature
  used?: number
  limit?: number
  resetAt: string
  /**
   * When true, the UI renders the upgrade modal. We set it on quota-style
   * failures and provider billing failures so the user is nudged to upgrade
   * (or retry) rather than seeing a raw error toast.
   */
  showUpgrade?: boolean
}

export class RateLimitExceededError extends Error {
  status: number
  payload: RateLimitError

  constructor(payload: RateLimitError, status: number = 429) {
    super(payload.error)
    this.name = 'RateLimitExceededError'
    this.status = status
    this.payload = payload
  }
}

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return /not_found_error|model:/i.test(error.message)
}

function buildResetMonthLabel(resetAt: string): string {
  try {
    const date = new Date(resetAt)
    return date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
  } catch {
    return 'next month'
  }
}

function throwRateLimit(payload: RateLimitError): never {
  throw new RateLimitExceededError(payload)
}

async function createMessage(
  model: string,
  input: {
    system?: string
    messages: MessageParam[]
    maxTokens: number
  }
): Promise<Message> {
  const system = input.system
    ? [{ type: 'text' as const, text: input.system, cache_control: { type: 'ephemeral' as const } }]
    : undefined

  return anthropic.messages.create({
    model,
    max_tokens: input.maxTokens,
    temperature: 0.2,
    system,
    stream: false,
    messages: input.messages,
  })
}

export function extractTextFromAnthropicMessage(response: Message): string {
  const textBlock = response.content.find((item) => item.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
}

export function isRateLimitExceededError(error: unknown): error is RateLimitExceededError {
  return error instanceof RateLimitExceededError
}

export async function callAnthropicWithLimits(params: {
  userId: string
  plan: Plan
  feature?: Feature
  inputText: string
  messages: MessageParam[]
  system?: string
}): Promise<Message> {
  const resetAt = getMonthlyResetAtIso()
  const limits = getPlanLimits(params.plan)
  const inputLength = params.inputText.length
  const estimatedInputTokens = Math.ceil(inputLength / 4)

  if (inputLength > limits.maxRawChars || estimatedInputTokens > limits.maxInputTokensPerCall) {
    throwRateLimit({
      error: 'The document is too long. Maximum 32,000 characters (~8 A4 pages).',
      limitType: 'input_too_long',
      resetAt,
    })
  }

  if (params.feature) {
    const featureCheck = await checkFeatureLimit(params.userId, params.feature, params.plan)

    if (!featureCheck.allowed) {
      await recordLimitHit(params.userId, params.feature)

      if (featureCheck.blocked) {
        throwRateLimit({
          error: 'Access to this feature has been temporarily suspended. Please contact support.',
          limitType: 'blocked',
          feature: params.feature,
          resetAt,
        })
      }

      throwRateLimit({
        error: `You have used all ${featureCheck.limit || 0} ${FEATURE_LABEL[params.feature]} available this month.`,
        limitType: 'feature',
        feature: params.feature,
        used: featureCheck.used,
        limit: featureCheck.limit ?? undefined,
        resetAt,
        showUpgrade: true,
      })
    }
  }

  const tokenReserve = await checkAndReserveTokens(params.userId, params.plan, estimatedInputTokens)
  if (!tokenReserve.allowed) {
    const limitType = tokenReserve.limitType || 'tokens'
    await recordLimitHit(params.userId, limitType)

    if (limitType === 'hard_cap') {
      throwRateLimit({
        error: 'The absolute monthly limit has been reached. Please contact support.',
        limitType,
        resetAt,
      })
    }

    const monthLabel = buildResetMonthLabel(resetAt)
    throwRateLimit({
      error: `You have reached your monthly AI limit. Upgrade your plan or wait for the reset on ${monthLabel} 1st.`,
      limitType,
      resetAt,
      showUpgrade: true,
    })
  }

  // Reuse the already resolved plan from the route to avoid plan drift
  // between DB cache and runtime overrides (e.g. GOD MODE / recruiting).
  const rateLimitStatus = await getRateLimitStatus(params.userId, params.plan)
  const tokenRemaining = rateLimitStatus.tokens.remaining

  if (tokenRemaining !== null && tokenRemaining <= 0) {
    await recordLimitHit(params.userId, 'tokens')
    const monthLabel = buildResetMonthLabel(resetAt)
    throwRateLimit({
      error: `You have reached your monthly AI limit. Upgrade your plan or wait for the reset on ${monthLabel} 1st.`,
      limitType: 'tokens',
      resetAt,
      showUpgrade: true,
    })
  }

  const maxTokens = tokenRemaining === null
    ? limits.maxOutputTokensPerCall
    : Math.max(1, Math.min(limits.maxOutputTokensPerCall, tokenRemaining))

  let response: Message

  try {
    try {
      response = await createMessage(defaultClaudeModel, {
        system: params.system,
        messages: params.messages,
        maxTokens,
      })
    } catch (error) {
      const shouldRetryWithFallback =
        defaultClaudeModel !== fallbackClaudeModel && isModelNotFoundError(error)

      if (!shouldRetryWithFallback) {
        throw error
      }

      response = await createMessage(fallbackClaudeModel, {
        system: params.system,
        messages: params.messages,
        maxTokens,
      })
    }
  } catch (error) {
    // Never let a raw provider error reach the route handler (and therefore
    // the client). Convert to a RateLimitExceededError with a sanitized
    // message; the real error stays available for server-side logging.
    const sanitized = sanitizeAiError(error)
    console.error('[ai] provider call failed', {
      category: sanitized.category,
      raw: sanitized.raw,
    })
    const status = sanitized.category === 'rate_limit' ? 429 : 503
    throw new RateLimitExceededError(
      {
        error: sanitized.userMessage,
        limitType: 'provider_unavailable',
        resetAt,
        showUpgrade: sanitized.showUpgrade,
      },
      status,
    )
  }

  const usedInputTokens = response.usage?.input_tokens ?? estimatedInputTokens
  const usedOutputTokens = response.usage?.output_tokens ?? 0

  await recordTokenUsage(params.userId, usedInputTokens, usedOutputTokens)

  if (params.feature) {
    await incrementFeatureCounter(params.userId, params.feature)
  }

  return response
}
