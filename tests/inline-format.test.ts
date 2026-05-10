import { describe, it, expect } from 'vitest'
import {
  hasInlineFormat,
  renderInlineLatex,
  stripInlineFormat,
  tokenizeInline,
} from '@/lib/inline-format'

describe('tokenizeInline', () => {
  it('returns a single text token when no markers are present', () => {
    expect(tokenizeInline('Plain copy with 2 * 3 = 6 maths')).toEqual([
      { kind: 'text', value: 'Plain copy with 2 * 3 = 6 maths' },
    ])
  })

  it('extracts bold, italic, and underline markers in order', () => {
    const tokens = tokenizeInline('Built **fast** and *iconic* __platforms__')
    expect(tokens).toEqual([
      { kind: 'text', value: 'Built ' },
      { kind: 'fmt', format: 'bold', value: 'fast' },
      { kind: 'text', value: ' and ' },
      { kind: 'fmt', format: 'italic', value: 'iconic' },
      { kind: 'text', value: ' ' },
      { kind: 'fmt', format: 'underline', value: 'platforms' },
    ])
  })

  it('keeps unmatched or whitespace-padded markers literal', () => {
    expect(tokenizeInline('lonely * star and ** broken')).toEqual([
      { kind: 'text', value: 'lonely * star and ** broken' },
    ])
  })

  it('does not span newlines inside markers', () => {
    const tokens = tokenizeInline('**still\nopen** ok')
    expect(tokens).toEqual([{ kind: 'text', value: '**still\nopen** ok' }])
  })
})

describe('stripInlineFormat', () => {
  it('returns plain text without markers', () => {
    expect(stripInlineFormat('Built **fast** *deploys*')).toBe('Built fast deploys')
  })

  it('returns empty string for falsy input', () => {
    expect(stripInlineFormat(undefined)).toBe('')
    expect(stripInlineFormat('')).toBe('')
  })
})

describe('hasInlineFormat', () => {
  it('detects formatted segments', () => {
    expect(hasInlineFormat('hello __world__')).toBe(true)
    expect(hasInlineFormat('plain copy')).toBe(false)
  })
})

describe('renderInlineLatex', () => {
  const noopEscape = (s: string) => s

  it('wraps each marker in the right LaTeX command', () => {
    expect(renderInlineLatex('Made **fast** and *clean*', noopEscape)).toBe(
      'Made \\textbf{fast} and \\textit{clean}',
    )
    expect(renderInlineLatex('Use __this__ tool', noopEscape)).toBe(
      'Use \\underline{this} tool',
    )
  })

  it('passes both literal and formatted segments through the escape callback', () => {
    const escape = (s: string) => s.replace(/&/g, '\\&')
    expect(renderInlineLatex('Ben & Jerry **R&D**', escape)).toBe(
      'Ben \\& Jerry \\textbf{R\\&D}',
    )
  })

  it('escapes plain strings with no markers', () => {
    const escape = (s: string) => s.replace(/&/g, '\\&')
    expect(renderInlineLatex('Profit & Loss', escape)).toBe('Profit \\& Loss')
  })
})
