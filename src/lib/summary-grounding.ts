// Grounding for AI-generated professional summaries: what the model is told
// about the resume, and the text its output is checked against.

type Row = Record<string, unknown>

function isRecord(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function rows(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(str).filter(Boolean) : []
}

/**
 * Earliest role start year, from the structured field or a 4-digit year in the
 * period text. Models asked to write a summary routinely guess "10+ years";
 * giving them the real span (and checking against it) stops that.
 */
export function careerStartYear(resumeData: Row): number | null {
  const years = rows(resumeData.experience).flatMap((entry) => {
    if (typeof entry.startYear === 'number') return [entry.startYear]
    const match = str(entry.period).match(/\b(19|20)\d{2}\b/)
    return match ? [Number(match[0])] : []
  })
  return years.length > 0 ? Math.min(...years) : null
}

export function careerSpanLine(resumeData: Row, now = new Date()): string {
  const start = careerStartYear(resumeData)
  if (!start || start > now.getFullYear()) return ''
  return `Career span: earliest role starts in ${start}, about ${now.getFullYear() - start} years ago.`
}

/** Education, projects and career span: facts buildResumeContext never sent. */
export function extraSummaryContext(resumeData: Row): string {
  const lines: string[] = []
  const education = rows(resumeData.education)
    .map((entry) => [str(entry.degree), str(entry.field), str(entry.institution)].filter(Boolean).join(', '))
    .filter(Boolean)
  if (education.length > 0) lines.push('Education:', ...education.map((line) => `- ${line}`))

  const projects = rows(resumeData.projects)
    .map((entry) => {
      const techs = strings(entry.technologies).join(', ')
      return [str(entry.name), str(entry.role), techs && `(${techs})`].filter(Boolean).join(' ')
    })
    .filter(Boolean)
  if (projects.length > 0) lines.push('Projects:', ...projects.slice(0, 6).map((line) => `- ${line}`))

  const span = careerSpanLine(resumeData)
  if (span) lines.push(span)
  return lines.join('\n')
}

/** Every fact the resume states, used as the haystack for the claim check. */
export function summarySourceText(resumeData: Row): string {
  const personal = isRecord(resumeData.personal) ? resumeData.personal : {}
  const parts = [str(personal.title), str(personal.summary), careerSpanLine(resumeData)]
  for (const entry of rows(resumeData.experience)) {
    parts.push(str(entry.title), str(entry.company), str(entry.period), str(entry.description), ...strings(entry.bullets))
  }
  for (const entry of rows(resumeData.projects)) {
    parts.push(str(entry.name), str(entry.role), str(entry.description), ...strings(entry.bullets), ...strings(entry.technologies))
  }
  for (const entry of rows(resumeData.education)) {
    parts.push(str(entry.institution), str(entry.degree), str(entry.field), str(entry.description))
  }
  for (const section of rows(resumeData.dynamicSections)) {
    parts.push(str(section.title), str(section.content))
  }
  return parts.filter(Boolean).join('\n')
}

/**
 * Keeps the first `max` sentences. A sentence ends at . ! ? followed by a
 * space and an uppercase letter, so "Node.js" or "3.5 years" is not a
 * sentence boundary; the old split cut summaries mid-sentence there.
 */
export function limitSentences(text: string, max: number): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  const sentences = compact.split(/(?<=[.!?])\s+(?=[\p{Lu}])/u)
  return sentences.slice(0, max).join(' ')
}
