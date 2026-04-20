import Anthropic from '@anthropic-ai/sdk'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const primaryClaudeModel = 'claude-haiku-4-5-20251001'
const fallbackClaudeModel = 'claude-3-haiku-20240307'
const defaultClaudeModel = process.env.ANTHROPIC_MODEL || primaryClaudeModel

const JSON_REPAIR_SYSTEM_PROMPT = `You are a strict JSON repair assistant.
Return ONLY valid JSON.
Do not add markdown, comments, code fences, explanations, or extra keys.
Preserve the original schema and values as closely as possible.`

function buildJsonRepairPrompt(rawText: string): string {
  const truncated = rawText.slice(0, 12000)
  return `Fix the malformed JSON-like content below into valid JSON and return only the repaired JSON.\n\n${truncated}`
}

function extractTextFromResponse(response: Anthropic.Message): string {
  const textBlock = response.content.find((c) => c.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
}

async function createMessage(model: string, systemPrompt: string, userPrompt: string): Promise<Anthropic.Message> {
  return anthropic.messages.create({
    model,
    max_tokens: 1800,
    temperature: 0.2,
    system: systemPrompt,
    stream: false,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })
}

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return /not_found_error|model:/i.test(error.message)
}

export async function askClaudeForText(systemPrompt: string, userPrompt: string) {
  try {
    const response = await createMessage(defaultClaudeModel, systemPrompt, userPrompt)
    return extractTextFromResponse(response)
  } catch (error) {
    const shouldRetryWithFallback =
      defaultClaudeModel !== fallbackClaudeModel && isModelNotFoundError(error)

    if (!shouldRetryWithFallback) {
      throw error
    }

    const fallbackResponse = await createMessage(fallbackClaudeModel, systemPrompt, userPrompt)
    return extractTextFromResponse(fallbackResponse)
  }
}

export async function askClaudeForJson(systemPrompt: string, userPrompt: string) {
  const text = await askClaudeForText(systemPrompt, userPrompt)

  try {
    return parseClaudeJsonText(text)
  } catch (error) {
    const parseMessage = error instanceof ClaudeJsonParseError ? error.parseError : null

    try {
      const repaired = await askClaudeForText(JSON_REPAIR_SYSTEM_PROMPT, buildJsonRepairPrompt(text))
      return parseClaudeJsonText(repaired)
    } catch {
      throw new ClaudeJsonParseError('AI response format was invalid. Please retry.', parseMessage)
    }
  }
}
