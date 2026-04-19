import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const fallbackClaudeModel = 'claude-3-haiku-20240307'
const defaultClaudeModel = process.env.ANTHROPIC_MODEL || fallbackClaudeModel

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
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      const candidate = text.slice(start, end + 1)
      return JSON.parse(candidate)
    }
    throw new Error('Claude did not return valid JSON')
  }
}
