// Lightweight inline-formatting layer used across the builder, the live
// resume preview, and the LaTeX export. Authors type plain markdown-style
// markers in textareas and we render them with the appropriate primitive in
// every output (HTML <strong>/<em>/<u>, LaTeX \textbf/\textit/\underline).
//
// Only flat (non-nested) emphasis is supported on purpose — nested formatting
// is rare in resume copy and would force a real markdown parser. The single
// regex below is conservative: markers must hug non-whitespace content and
// cannot span newlines, so accidental asterisks in numeric expressions stay
// literal.

export type InlineFormat = 'bold' | 'italic' | 'underline'

export type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'fmt'; format: InlineFormat; value: string }

const INLINE_PATTERN =
  /\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*|__(?=\S)([^_\n]+?)(?<=\S)__|\*(?=\S)([^*\n]+?)(?<=\S)\*/g

export function tokenizeInline(input: string | null | undefined): InlineToken[] {
  if (!input) return []
  const tokens: InlineToken[] = []
  const regex = new RegExp(INLINE_PATTERN.source, 'g')
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', value: input.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) {
      tokens.push({ kind: 'fmt', format: 'bold', value: match[1] })
    } else if (match[2] !== undefined) {
      tokens.push({ kind: 'fmt', format: 'underline', value: match[2] })
    } else if (match[3] !== undefined) {
      tokens.push({ kind: 'fmt', format: 'italic', value: match[3] })
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < input.length) {
    tokens.push({ kind: 'text', value: input.slice(lastIndex) })
  }
  return tokens
}

// Returns the input text with all formatting markers removed. Useful for
// places that still want a clean string (search indexes, summaries, etc).
export function stripInlineFormat(input: string | null | undefined): string {
  if (!input) return ''
  return tokenizeInline(input)
    .map((token) => token.value)
    .join('')
}

export function hasInlineFormat(input: string | null | undefined): boolean {
  if (!input) return false
  return tokenizeInline(input).some((token) => token.kind === 'fmt')
}

const LATEX_COMMANDS: Record<InlineFormat, string> = {
  bold: 'textbf',
  italic: 'textit',
  underline: 'underline',
}

// Renders a string into LaTeX while honouring the inline markers. The escape
// callback is provided by the caller because LaTeX escaping is opinionated
// (e.g. `escapeLatex` already handles ampersands, percent signs, etc).
export function renderInlineLatex(
  input: string | null | undefined,
  escape: (segment: string) => string,
): string {
  if (!input) return ''
  const tokens = tokenizeInline(input)
  if (tokens.length === 0) return escape(input)
  return tokens
    .map((token) => {
      if (token.kind === 'text') return escape(token.value)
      const escaped = escape(token.value)
      return `\\${LATEX_COMMANDS[token.format]}{${escaped}}`
    })
    .join('')
}
