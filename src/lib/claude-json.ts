export class ClaudeJsonParseError extends Error {
  readonly parseError: string | null

  constructor(message: string, parseError?: string | null) {
    super(message)
    this.name = 'ClaudeJsonParseError'
    this.parseError = parseError || null
  }
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (!fenced) return trimmed
  return fenced[1]?.trim() || ''
}

function extractBalancedSnippet(text: string, opening: '{' | '[', closing: '}' | ']'): string | null {
  const start = text.indexOf(opening)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === '"') {
        inString = false
      }

      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === opening) {
      depth += 1
      continue
    }

    if (char === closing) {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
      if (depth < 0) {
        return null
      }
    }
  }

  return null
}

function removeTrailingCommas(value: string): string {
  return value.replace(/,\s*([}\]])/g, '$1')
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }

  return result
}

function buildCandidates(text: string): string[] {
  const trimmed = text.trim()
  const noFence = stripCodeFence(trimmed)
  const objectSnippet = extractBalancedSnippet(noFence, '{', '}') || ''
  const arraySnippet = extractBalancedSnippet(noFence, '[', ']') || ''

  const baseCandidates = uniqueNonEmpty([
    trimmed,
    noFence,
    objectSnippet,
    arraySnippet,
  ])

  const relaxedCandidates = baseCandidates.map(removeTrailingCommas)
  return uniqueNonEmpty([...baseCandidates, ...relaxedCandidates])
}

export function parseClaudeJsonText(text: string): unknown {
  const candidates = buildCandidates(text)
  let lastErrorMessage: string | null = null

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch (error) {
      lastErrorMessage = error instanceof Error ? error.message : String(error)
    }
  }

  throw new ClaudeJsonParseError('Claude returned malformed JSON.', lastErrorMessage)
}
