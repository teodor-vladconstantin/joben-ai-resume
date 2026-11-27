// Pure bullet helpers for the resume editor.
export function splitCombinedBullet(value: string): string[] {
  const cleaned = value.trim()
  if (!cleaned) return []

  // Newlines are the strongest separator: they map directly to one-bullet-per-line.
  const newlineSplit = cleaned.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean)
  if (newlineSplit.length > 1) return newlineSplit

  const bulletSplit = cleaned.split(/\s*[•·▪◦●○▸▶➤➢✓✔]\s+/)
  if (bulletSplit.length > 1) return bulletSplit.map((s) => s.trim()).filter(Boolean)

  const numberedSplit = cleaned.split(/(?<!\d)\d{1,2}[.)]\s+/)
  if (numberedSplit.length > 1) {
    const parts = numberedSplit.map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) return parts
  }

  const sentenceSplit = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean)
  return sentenceSplit.length > 1 ? sentenceSplit : [cleaned]
}

export function normalizeExperienceBullets(
  input: unknown,
  fallbackDescription?: string,
  options?: { keepEmpty?: boolean }
): string[] {

  if (Array.isArray(input) && input.length > 0) {
    const rawBullets = input.map((item) => (typeof item === 'string' ? item : ''))

    if (options?.keepEmpty) {
      const nonEmpty = rawBullets.map((item) => item.trim()).filter(Boolean)
      if (nonEmpty.length === 1) return splitCombinedBullet(nonEmpty[0])
      return rawBullets
    }

    const normalizedBullets = rawBullets.map((item) => item.trim()).filter(Boolean)
    if (normalizedBullets.length === 1) return splitCombinedBullet(normalizedBullets[0])
    if (normalizedBullets.length > 0) return normalizedBullets
  }

  if (typeof fallbackDescription === 'string' && fallbackDescription.trim()) {
    return splitCombinedBullet(fallbackDescription)
  }

  return ['']
}

// Feeds the editor's controlled textareas, so stored bullets come back untouched.
// Trimming and splitting belong to load and import (normalizeExperienceBullets):
// running them on every keystroke eats spaces and drops the new empty bullet.
export function getExperienceBullets(entry: { bullets?: string[]; description?: string }): string[] {
  return entry.bullets?.length ? entry.bullets : normalizeExperienceBullets(undefined, entry.description)
}
