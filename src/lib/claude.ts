import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const defaultClaudeModel = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest'

export async function askClaudeForText(systemPrompt: string, userPrompt: string) {
  const response = await anthropic.messages.create({
    model: defaultClaudeModel,
    max_tokens: 1800,
    temperature: 0.2,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const textBlock = response.content.find((c) => c.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text : ''
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
