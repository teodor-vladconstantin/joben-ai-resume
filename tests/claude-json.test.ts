import { describe, expect, it } from 'vitest'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'

describe('parseClaudeJsonText', () => {
  it('parses valid JSON directly', () => {
    const value = parseClaudeJsonText('{"ok":true,"score":91}') as { ok: boolean; score: number }
    expect(value.ok).toBe(true)
    expect(value.score).toBe(91)
  })

  it('parses JSON inside markdown code fences', () => {
    const value = parseClaudeJsonText('```json\n{"grade":"Good"}\n```') as { grade: string }
    expect(value.grade).toBe('Good')
  })

  it('parses JSON wrapped in preamble and trailing text', () => {
    const value = parseClaudeJsonText('Here is your result:\n{"overall_score":82}\nThanks!') as { overall_score: number }
    expect(value.overall_score).toBe(82)
  })

  it('parses top-level arrays', () => {
    const value = parseClaudeJsonText('before\n["a","b","c"]\nafter') as string[]
    expect(value).toEqual(['a', 'b', 'c'])
  })

  it('repairs trailing commas in objects and arrays', () => {
    const value = parseClaudeJsonText('{"items":["a","b",],"ok":true,}') as {
      items: string[]
      ok: boolean
    }
    expect(value.items).toEqual(['a', 'b'])
    expect(value.ok).toBe(true)
  })

  it('handles braces inside string values', () => {
    const value = parseClaudeJsonText('{"text":"Used {Redis} and [Kafka] in production"}') as { text: string }
    expect(value.text).toContain('{Redis}')
  })

  it('throws ClaudeJsonParseError for unrecoverable content', () => {
    expect(() => parseClaudeJsonText('not json at all and no brackets')).toThrow(ClaudeJsonParseError)
  })
})
