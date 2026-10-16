// Instant, rule-based resume check (no LLM). Returns language-neutral codes;
// all user-facing text lives in messages/{ro,en}.json under "FastAts".
// ponytail: heuristics only (regex sections, verb lists, metric patterns).
// The AI checker (/api/public/ats-check) is the deep analysis.

export type FastAtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'
export type FastAtsGrade = 'Poor' | 'Fair' | 'Good' | 'Excellent'
export type FastAtsSectionKey =
  | 'experience'
  | 'education'
  | 'skills'
  | 'summary'
  | 'projects'
  | 'certifications'
  | 'languages'

export type FastAtsIssueId =
  | 'missing_email'
  | 'missing_phone'
  | 'short_resume'
  | 'missing_experience_section'
  | 'missing_skills_section'
  | 'lack_of_metrics'
  | 'dense_paragraphs'
  | 'passive_verbs'
  | 'generic_verbs'
  | 'missing_summary'
  | 'missing_linkedin'
  | 'no_dates'
  | 'too_long'
  | 'missing_languages'
  | 'missing_certifications'

export interface FastAtsIssue {
  id: FastAtsIssueId
  severity: 'critical' | 'warning' | 'info'
  params?: Record<string, number>
}

export interface FastAtsAnalysisResult {
  overallScore: number
  grade: FastAtsGrade
  wordCount: number
  characterCount: number
  categories: Record<FastAtsCategoryKey, { score: number; max: number }>
  // Every issue actually detected, most severe first. No placeholders.
  issues: FastAtsIssue[]
  metricsFoundCount: number
  detectedSections: FastAtsSectionKey[]
  missingSections: FastAtsSectionKey[]
  hasLinkedIn: boolean
  hasPhone: boolean
  hasEmail: boolean
}

const ACTION_VERBS = new Set([
  // RO (past participle, as used after "Am ..." or alone on a bullet)
  'coordonat', 'dezvoltat', 'implementat', 'optimizat', 'condus', 'redus', 'crescut',
  'generat', 'creat', 'gestionat', 'lansat', 'negociat', 'livrat', 'structurat',
  'analizat', 'reproiectat', 'automatizat', 'reorganizat', 'instruit', 'finalizat',
  'proiectat', 'executat', 'facilitat', 'colaborat', 'supervizat', 'integrat',
  'construit', 'migrat', 'administrat', 'organizat', 'planificat', 'vândut', 'obținut',
  // EN
  'led', 'managed', 'developed', 'created', 'implemented', 'optimized', 'reduced',
  'increased', 'built', 'spearheaded', 'designed', 'delivered', 'automated', 'launched',
  'engineered', 'drove', 'achieved', 'negotiated', 'streamlined', 'analyzed', 'executed',
  'migrated', 'coordinated', 'improved', 'established', 'grew', 'owned', 'scaled',
])

const GENERIC_STARTS = new Set([
  'responsabil', 'responsabilă', 'ajutat', 'lucrat', 'participat', 'asistat', 'ocupat',
  'responsible', 'helped', 'worked', 'assisted', 'participated', 'tasked', 'duties',
])

const SECTION_PATTERNS: { key: FastAtsSectionKey; regex: RegExp }[] = [
  { key: 'experience', regex: /(experien[țţt][aă]|experience|work history|istoric profesional|employment)/i },
  { key: 'education', regex: /(educa[țţt]ie|education|studii|academic|formare)/i },
  { key: 'skills', regex: /(abilit[aă][țţt]i|skills|competen[țţt]e|tehnologii|expertiz[aă]|core competencies)/i },
  { key: 'summary', regex: /(profil|rezumat|sumar|summary|despre mine|about me|obiectiv|objective)/i },
  { key: 'projects', regex: /(proiecte|projects|portofoliu|portfolio)/i },
  { key: 'certifications', regex: /(certific[aă]ri|certifications?|cursuri|courses|training|acredit[aă]ri)/i },
  { key: 'languages', regex: /(limbi str[aă]ine|limbi|languages)/i },
]

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 } as const

function firstWords(line: string): string[] {
  return line.replace(/^[-•*–—▪●◦\d.)\s]+/, '').toLowerCase().split(/\s+/)
}

export function analyzeResumeTextLightweight(rawText: string): FastAtsAnalysisResult {
  const text = rawText.trim()
  const words = text.split(/\s+/).filter(Boolean)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const wordCount = words.length
  const characterCount = text.length

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)
  const hasPhone = /(?:\+|00)?\d[\d\s().-]{7,15}\d/.test(text)
  const hasLinkedIn = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i.test(text)

  const detectedSections: FastAtsSectionKey[] = []
  const missingSections: FastAtsSectionKey[] = []
  for (const sec of SECTION_PATTERNS) {
    if (sec.regex.test(text)) detectedSections.push(sec.key)
    else missingSections.push(sec.key)
  }
  const has = (key: FastAtsSectionKey) => detectedSections.includes(key)

  const metricRegex = /(\b\d+(?:[.,]\d+)?\s?%|\b(?:\$|€|RON|EUR|USD|lei)\s*\d+[\d.,]*|\b\d+[\d.,]*\s*(?:k|mil|milioane|million|proiecte|projects|clien[țţt]i|clients|utilizatori|users|leads|v[aâ]nz[aă]ri|sales|persoane|people|oameni)\b)/gi
  const metricsFoundCount = (text.match(metricRegex) || []).length

  let actionVerbCount = 0
  let genericStartCount = 0
  for (const line of lines) {
    const [w0, w1] = firstWords(line)
    // "Am coordonat ..." counts as an action verb in Romanian.
    const verb = w0 === 'am' ? w1 : w0
    if (verb && ACTION_VERBS.has(verb)) actionVerbCount++
    if (verb && GENERIC_STARTS.has(verb)) genericStartCount++
  }

  const hasDates = (text.match(/\b(?:19|20)\d{2}\b/g) || []).length >= 2
  const longLinesCount = lines.filter((l) => l.split(/\s+/).length > 35).length

  // --- Category scores (max 25 each) ---
  let formattingScore = 10
  if (wordCount >= 250 && wordCount <= 1200) formattingScore += 9
  else if (wordCount > 1200) formattingScore += 4
  else if (wordCount < 100) formattingScore = 3
  else formattingScore += 1
  if (lines.length >= 15) formattingScore += 4
  if (!text.includes('\u0000') && !text.includes('CID:')) formattingScore += 2
  formattingScore = Math.max(3, Math.min(25, formattingScore))

  let structureScore = 4
  if (hasEmail) structureScore += 3
  if (hasPhone) structureScore += 3
  if (hasLinkedIn) structureScore += 3
  if (has('experience')) structureScore += 4
  if (has('education')) structureScore += 3
  if (has('skills')) structureScore += 3
  if (hasDates) structureScore += 2
  structureScore = Math.max(3, Math.min(25, structureScore))

  let keywordScore = 3
  if (metricsFoundCount >= 5) keywordScore += 12
  else if (metricsFoundCount >= 2) keywordScore += 7
  else if (metricsFoundCount === 1) keywordScore += 3
  if (actionVerbCount >= 6) keywordScore += 10
  else if (actionVerbCount >= 3) keywordScore += 6
  else if (actionVerbCount >= 1) keywordScore += 2
  keywordScore = Math.max(3, Math.min(25, keywordScore))

  let clarityScore = 8
  if (longLinesCount === 0) clarityScore += 6
  else if (longLinesCount <= 2) clarityScore += 3
  else clarityScore -= 4
  if (wordCount >= 300) clarityScore += 7
  else if (wordCount < 100) clarityScore = 4
  if (detectedSections.length >= 3) clarityScore += 4
  clarityScore = Math.max(3, Math.min(25, clarityScore))

  const overallScore = Math.round(formattingScore + structureScore + keywordScore + clarityScore)

  let grade: FastAtsGrade = 'Poor'
  if (overallScore >= 80) grade = 'Excellent'
  else if (overallScore >= 65) grade = 'Good'
  else if (overallScore >= 45) grade = 'Fair'

  // --- Issues: only what was actually detected ---
  const issues: FastAtsIssue[] = []
  const add = (id: FastAtsIssueId, severity: FastAtsIssue['severity'], params?: Record<string, number>) =>
    issues.push(params ? { id, severity, params } : { id, severity })

  if (!hasEmail) add('missing_email', 'critical')
  if (!hasPhone) add('missing_phone', 'warning')
  if (wordCount < 250) add('short_resume', 'critical', { count: wordCount })
  if (!has('experience')) add('missing_experience_section', 'critical')
  if (!has('skills')) add('missing_skills_section', 'critical')
  if (metricsFoundCount < 3) add('lack_of_metrics', 'critical', { count: metricsFoundCount })
  if (longLinesCount > 0) add('dense_paragraphs', 'warning', { count: longLinesCount })
  if (actionVerbCount < 4) add('passive_verbs', 'warning', { count: actionVerbCount })
  if (genericStartCount >= 2) add('generic_verbs', 'warning', { count: genericStartCount })
  if (!has('summary')) add('missing_summary', 'warning')
  if (!hasLinkedIn) add('missing_linkedin', 'warning')
  if (!hasDates) add('no_dates', 'warning')
  if (wordCount > 1200) add('too_long', 'warning', { count: wordCount })
  if (!has('languages')) add('missing_languages', 'info')
  if (!has('certifications')) add('missing_certifications', 'info')

  issues.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

  return {
    overallScore,
    grade,
    wordCount,
    characterCount,
    categories: {
      ats_formatting: { score: formattingScore, max: 25 },
      structure: { score: structureScore, max: 25 },
      keyword_impact: { score: keywordScore, max: 25 },
      clarity: { score: clarityScore, max: 25 },
    },
    issues,
    metricsFoundCount,
    detectedSections,
    missingSections,
    hasLinkedIn,
    hasPhone,
    hasEmail,
  }
}
