import { describe, it, expect } from 'vitest'
import { sanitizeAiError, stripProviderMentions } from '@/lib/ai-errors'

describe('sanitizeAiError', () => {
  it('classifies credit balance failures as quota (shows upgrade)', () => {
    const result = sanitizeAiError(
      new Error('Your credit balance is too low to access the Anthropic API.')
    )
    expect(result.category).toBe('quota')
    expect(result.showUpgrade).toBe(true)
    expect(result.userMessage).not.toMatch(/anthropic|credit/i)
  })

  it('classifies 429 / too many requests as rate_limit (no upgrade)', () => {
    const result = sanitizeAiError(new Error('Rate limit exceeded (429)'))
    expect(result.category).toBe('rate_limit')
    expect(result.showUpgrade).toBe(false)
    expect(result.userMessage).not.toMatch(/anthropic|claude/i)
  })

  it('classifies auth errors without exposing provider', () => {
    const result = sanitizeAiError(new Error('401 Unauthorized — invalid api key'))
    expect(result.category).toBe('auth')
    expect(result.showUpgrade).toBe(false)
    expect(result.userMessage).not.toMatch(/anthropic|claude|api\s*key/i)
  })

  it('scrubs anything mentioning claude / openai / gemini', () => {
    const result = sanitizeAiError(new Error('The Claude model returned an unexpected value'))
    expect(result.userMessage).not.toMatch(/claude|anthropic/i)
  })

  it('still hides provider names via stripProviderMentions', () => {
    expect(stripProviderMentions('Your Anthropic billing is low')).not.toMatch(/anthropic|billing/i)
    expect(stripProviderMentions('some generic error')).toBe('some generic error')
  })

  it('keeps raw message on the server-side category for logs', () => {
    const raw = 'Your credit balance is too low to access the Anthropic API.'
    const result = sanitizeAiError(new Error(raw))
    expect(result.raw).toBe(raw)
  })
})
