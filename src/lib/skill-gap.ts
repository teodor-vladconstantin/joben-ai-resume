// Pure helpers for the Tailor v2 skill-gap analysis. Kept separate from
// src/app/api/tailor/route.ts and src/lib/resume-parser-client.ts (network
// glue) so the diff/text-building logic is unit-testable without mocking
// fetch or Clerk auth.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pushStringArray(value: unknown, out: string[]): void {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item)
    }
  }
}

/**
 * Flattens the skill-relevant free text out of a resume's loosely-typed
 * JSONB blob (summary, skills sections, experience/project descriptions and
 * bullets, project technologies) so it can be run through the resume-parser
 * skill extractor. Defensive by design — `resumeData` is validated only as
 * `z.record(z.string(), z.unknown())` (see resumeDataSchema), so any field
 * can be missing or malformed.
 */
export function extractSkillGapInputText(resumeData: Record<string, unknown>): string {
  const parts: string[] = []

  if (isRecord(resumeData.personal) && typeof resumeData.personal.summary === 'string') {
    if (resumeData.personal.summary.trim()) parts.push(resumeData.personal.summary)
  }

  if (Array.isArray(resumeData.dynamicSections)) {
    for (const section of resumeData.dynamicSections) {
      if (isRecord(section) && section.type === 'skills' && typeof section.content === 'string') {
        if (section.content.trim()) parts.push(section.content)
      }
    }
  }

  if (Array.isArray(resumeData.experience)) {
    for (const entry of resumeData.experience) {
      if (!isRecord(entry)) continue
      if (typeof entry.description === 'string' && entry.description.trim()) {
        parts.push(entry.description)
      }
      pushStringArray(entry.bullets, parts)
    }
  }

  if (Array.isArray(resumeData.projects)) {
    for (const entry of resumeData.projects) {
      if (!isRecord(entry)) continue
      if (typeof entry.description === 'string' && entry.description.trim()) {
        parts.push(entry.description)
      }
      pushStringArray(entry.bullets, parts)
      pushStringArray(entry.technologies, parts)
    }
  }

  return parts.join('\n')
}

/**
 * Case-insensitive set difference: skills the job description mentions that
 * the resume's extracted skills don't cover. Preserves the job description's
 * casing/order and dedupes.
 */
export function computeMissingSkills(resumeSkills: string[], jobSkills: string[]): string[] {
  const resumeSet = new Set(resumeSkills.map((skill) => skill.toLowerCase()))
  const seen = new Set<string>()
  const missing: string[] = []

  for (const skill of jobSkills) {
    const key = skill.toLowerCase()
    if (!key || resumeSet.has(key) || seen.has(key)) continue
    seen.add(key)
    missing.push(skill)
  }

  return missing
}
