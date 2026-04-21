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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const primaryClaudeModel = 'claude-haiku-4-5-20251001'
const fallbackClaudeModel = 'claude-3-haiku-20240307'
const defaultClaudeModel = process.env.ANTHROPIC_MODEL || primaryClaudeModel

const FEATURE_LABEL: Record<Feature, string> = {
  covers: 'scrisori',
  jds: 'JD-uri',
  bullets: 'bullet-uri',
  cvs: 'CV-uri',
}

export type MessageParam = Anthropic.MessageParam
export type Message = Anthropic.Message

export interface RateLimitError {
  error: string
  limitType: 'tokens' | 'hard_cap' | 'feature' | 'blocked' | 'input_too_long'
  feature?: Feature
  used?: number
  limit?: number
  resetAt: string
}

export class RateLimitExceededError extends Error {
  status: number
  payload: RateLimitError

  constructor(payload: RateLimitError) {
    super(payload.error)
    this.name = 'RateLimitExceededError'
    this.status = 429
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
    return date.toLocaleString('ro-RO', { month: 'long', timeZone: 'UTC' })
  } catch {
    return 'luna urmatoare'
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
  return anthropic.messages.create({
    model,
    max_tokens: input.maxTokens,
    temperature: 0.2,
    system: input.system,
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
      error: 'Documentul este prea lung. Maxim 32.000 de caractere (~8 pagini A4).',
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
          error: 'Accesul la acest feature a fost suspendat temporar. Contacteaza suportul.',
          limitType: 'blocked',
          feature: params.feature,
          resetAt,
        })
      }

      throwRateLimit({
        error: `Ai utilizat toate cele ${featureCheck.limit || 0} ${FEATURE_LABEL[params.feature]} disponibile luna aceasta.`,
        limitType: 'feature',
        feature: params.feature,
        used: featureCheck.used,
        limit: featureCheck.limit ?? undefined,
        resetAt,
      })
    }
  }

  const tokenReserve = await checkAndReserveTokens(params.userId, params.plan, estimatedInputTokens)
  if (!tokenReserve.allowed) {
    const limitType = tokenReserve.limitType || 'tokens'
    await recordLimitHit(params.userId, limitType)

    if (limitType === 'hard_cap') {
      throwRateLimit({
        error: 'Limita absoluta lunara a fost atinsa. Contacteaza suportul.',
        limitType,
        resetAt,
      })
    }

    const monthLabel = buildResetMonthLabel(resetAt)
    throwRateLimit({
      error: `Ai atins limita lunara de AI. Upgradeaza planul sau asteapta resetarea pe 1 ${monthLabel}.`,
      limitType,
      resetAt,
    })
  }

  const rateLimitStatus = await getRateLimitStatus(params.userId)
  const tokenRemaining = rateLimitStatus.tokens.remaining

  if (tokenRemaining !== null && tokenRemaining <= 0) {
    await recordLimitHit(params.userId, 'tokens')
    const monthLabel = buildResetMonthLabel(resetAt)
    throwRateLimit({
      error: `Ai atins limita lunara de AI. Upgradeaza planul sau asteapta resetarea pe 1 ${monthLabel}.`,
      limitType: 'tokens',
      resetAt,
    })
  }

  const maxTokens = tokenRemaining === null
    ? limits.maxOutputTokensPerCall
    : Math.max(1, Math.min(limits.maxOutputTokensPerCall, tokenRemaining))

  let response: Message

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

  const usedInputTokens = response.usage?.input_tokens ?? estimatedInputTokens
  const usedOutputTokens = response.usage?.output_tokens ?? 0

  await recordTokenUsage(params.userId, usedInputTokens, usedOutputTokens)

  if (params.feature) {
    await incrementFeatureCounter(params.userId, params.feature)
  }

  return response
}
