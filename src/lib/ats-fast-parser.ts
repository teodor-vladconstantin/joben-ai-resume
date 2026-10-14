export type FastAtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'
export type FastAtsGrade = 'Poor' | 'Fair' | 'Good' | 'Excellent'

export interface FastAtsCategory {
  score: number
  max: number
  label: string
}

export interface FastAtsIssue {
  id: string
  title: string
  severity: 'critical' | 'warning' | 'info'
  explanation: string
  howToFix: string
  isTeaserVisible: boolean // true for top 3, false for locked
}

export interface FastAtsAnalysisResult {
  overallScore: number
  grade: FastAtsGrade
  wordCount: number
  characterCount: number
  categories: Record<FastAtsCategoryKey, FastAtsCategory>
  visibleIssues: FastAtsIssue[]
  lockedIssuesCount: number
  lockedIssuesPreview: { title: string; category: string }[]
  metricsFoundCount: number
  detectedSections: string[]
  missingSections: string[]
  hasLinkedIn: boolean
  hasPhone: boolean
  hasEmail: boolean
}

// Action verbs in Romanian and English
const ACTION_VERBS_RO = [
  'coordonat', 'dezvoltat', 'implementat', 'optimizat', 'condus', 'redus', 'crescut',
  'generat', 'creat', 'gestionat', 'lansat', 'negociat', 'livrat', 'structurat',
  'analizat', 'reproiectat', 'automatizat', 'reorganizat', 'instruit', 'finalizat',
  'proiectat', 'executat', 'facilitat', 'colaborat', 'supervizat', 'integrat'
]

const ACTION_VERBS_EN = [
  'led', 'managed', 'developed', 'created', 'implemented', 'optimized', 'reduced',
  'increased', 'built', 'spearheaded', 'designed', 'delivered', 'automated', 'launched',
  'engineered', 'drove', 'achieved', 'negotiated', 'streamlined', 'analyzed', 'executed'
]

const ALL_ACTION_VERBS = new Set([...ACTION_VERBS_RO, ...ACTION_VERBS_EN])

// Standard section patterns
const SECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Experiență Profesională', regex: /(experien[țt][aă]|experience|work history|istoric profesional|employment)/i },
  { name: 'Educație și Studii', regex: /(educa[țt]ie|education|studii|academic|formare)/i },
  { name: 'Abilități și Competențe', regex: /(abilit[aă][țt]i|skills|competen[țt]e|tehnologii|expertiz[aă]|core competencies)/i },
  { name: 'Sumar / Profil Profesional', regex: /(profil|summary|despre mine|about me|obiectiv|professional summary)/i },
  { name: 'Proiecte / Portofoliu', regex: /(proiecte|projects|portofoliu|portfolio)/i },
  { name: 'Certificări / Cursuri', regex: /(certific[aă]ri|certifications|cursuri|training|acredit[aă]ri)/i },
  { name: 'Limbi Străine', regex: /(limbi|languages|limbi str[aă]ine)/i },
]

export function analyzeResumeTextLightweight(rawText: string): FastAtsAnalysisResult {
  const text = rawText.trim()
  const lowerText = text.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const wordCount = words.length
  const characterCount = text.length

  // Contact checks
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  const phoneMatch = text.match(/(?:\+40|0040|0)[0-9\s.-]{8,13}/)
  const linkedInMatch = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i.test(text)
  const githubMatch = /github\.com\/[a-zA-Z0-9_-]+/i.test(text)

  const hasEmail = Boolean(emailMatch)
  const hasPhone = Boolean(phoneMatch)
  const hasLinkedIn = Boolean(linkedInMatch)

  // Sections check
  const detectedSections: string[] = []
  const missingSections: string[] = []

  SECTION_PATTERNS.forEach((sec) => {
    if (sec.regex.test(text)) {
      detectedSections.push(sec.name)
    } else {
      missingSections.push(sec.name)
    }
  })

  // Metric quantification checks
  const metricRegex = /(\b\d+(?:[.,]\d+)?%|\b(?:\$|€|RON|EUR|USD)\s*\d+[\d.,]*|\b\d+[\d.,]*\s*(?:k|mil|milioane|proiecte|clien[țt]i|utilizatori|users|clients|leads|v[aâ]nz[aă]ri)\b)/gi
  const metricsFound = text.match(metricRegex) || []
  const metricsFoundCount = metricsFound.length

  // Action verbs check on line starts / bullets
  let actionVerbCount = 0
  lines.forEach((line) => {
    const firstWord = line.replace(/^[-•*–—\d.)\s]+/, '').split(/\s+/)[0]?.toLowerCase()
    if (firstWord && ALL_ACTION_VERBS.has(firstWord)) {
      actionVerbCount++
    }
  })

  // Date consistency
  const datePatterns = text.match(/\b(?:20\d{2}|19\d{2})\b/g) || []
  const hasDates = datePatterns.length >= 2

  // --- Category Scores (max 25 each) ---

  // 1. ATS Formatting (headings, length, readability, clean text)
  let formattingScore = 10
  if (wordCount >= 250 && wordCount <= 1200) formattingScore += 9
  else if (wordCount > 1200) formattingScore += 4
  else if (wordCount < 100) formattingScore = 3
  else formattingScore += 1

  if (lines.length >= 15) formattingScore += 4
  if (!text.includes('\u0000') && !text.includes('CID:')) formattingScore += 2
  formattingScore = Math.max(3, Math.min(25, formattingScore))

  // 2. Structure & Sections
  let structureScore = 4
  if (hasEmail) structureScore += 3
  if (hasPhone) structureScore += 3
  if (hasLinkedIn) structureScore += 3
  if (detectedSections.includes('Experiență Profesională')) structureScore += 4
  if (detectedSections.includes('Educație și Studii')) structureScore += 3
  if (detectedSections.includes('Abilități și Competențe')) structureScore += 3
  if (hasDates) structureScore += 2
  structureScore = Math.max(3, Math.min(25, structureScore))

  // 3. Keyword Impact & Quantification
  let keywordScore = 3
  if (metricsFoundCount >= 5) keywordScore += 12
  else if (metricsFoundCount >= 2) keywordScore += 7
  else if (metricsFoundCount === 1) keywordScore += 3

  if (actionVerbCount >= 6) keywordScore += 10
  else if (actionVerbCount >= 3) keywordScore += 6
  else if (actionVerbCount >= 1) keywordScore += 2
  keywordScore = Math.max(3, Math.min(25, keywordScore))

  // 4. Clarity & Concise Writing
  let clarityScore = 8
  const longLinesCount = lines.filter((l) => l.split(/\s+/).length > 35).length
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

  // --- Issues Discovery & Prioritization ---
  const allIssues: FastAtsIssue[] = []

  // Issue 1: Metrics
  if (metricsFoundCount < 3) {
    allIssues.push({
      id: 'lack_of_metrics',
      title: 'Lipsă de rezultate cuantificabile (procente și cifre)',
      severity: 'critical',
      explanation: `CV-ul tău conține doar ${metricsFoundCount} rezultate numerice. Sistemele ATS și recrutorii prioritizează profilele cu impact măsurabil direct.`,
      howToFix: 'Adaugă rezultate măsurate: ex. „Crescut vânzările cu 25%”, „Redus timpul de încărcare cu 1.4s”, „Gestionat echipă de 6 specialiști”.',
      isTeaserVisible: true,
    })
  }

  // Issue 2: Skills section / keywords
  if (!detectedSections.includes('Abilități și Competențe')) {
    allIssues.push({
      id: 'missing_skills_section',
      title: 'Secțiunea de Abilități Tehnice / Competențe nu este etichetată standard',
      severity: 'critical',
      explanation: 'Sistemele ATS scanează secțiuni specifice („Skills” / „Competențe”). Fără această rubrică dedicată, cuvintele tale cheie sunt ignorate de algoritm.',
      howToFix: 'Creează o secțiune dedicată numită „Abilități și Competențe” divizată în Competențe Tehnice și Abilități Interpersonale.',
      isTeaserVisible: true,
    })
  }

  // Issue 3: LinkedIn
  if (!hasLinkedIn) {
    allIssues.push({
      id: 'missing_linkedin',
      title: 'Lipsește linkul optimizat către profilul LinkedIn',
      severity: 'warning',
      explanation: 'Peste 90% dintre recrutorii din România verifică profilul de LinkedIn în paralel cu scanarea ATS. Absența link-ului scade rata de conversie spre interviu.',
      howToFix: 'Include link-ul personalizat (ex: linkedin.com/in/numeprenume) în antetul CV-ului lângă datele de contact.',
      isTeaserVisible: true,
    })
  }

  // Issue 4: Action verbs
  if (actionVerbCount < 4) {
    allIssues.push({
      id: 'passive_verbs',
      title: 'Descrieri pasive în loc de verbe de acțiune la început de rând',
      severity: 'warning',
      explanation: 'Punctele tale de experiență conțin formulări pasive („Responsabil cu...”, „M-am ocupat de...”) care nu atrag atenția algoritmilor de ranking.',
      howToFix: 'Începe fiecare bullet point cu un verb puternic la timpul trecut: „Dezvoltat”, „Coordonat”, „Optimizat”, „Implementat”.',
      isTeaserVisible: allIssues.length < 3,
    })
  }

  // Issue 5: Summary
  if (!detectedSections.includes('Sumar / Profil Profesional')) {
    allIssues.push({
      id: 'missing_summary',
      title: 'Lipsește Sumarul Profesional (Elevator Pitch)',
      severity: 'warning',
      explanation: 'Fără o introducere de 2-3 rânduri în antet, algoritmul ATS nu poate asocia rapid nivelul tău de senioritate cu cerințele rolului.',
      howToFix: 'Scrie un paragraf scurt de 3-4 rânduri la începutul CV-ului cu anii de experiență și competențele cheie principale.',
      isTeaserVisible: allIssues.length < 3,
    })
  }

  // Issue 6: Wall of text
  if (longLinesCount > 0) {
    allIssues.push({
      id: 'dense_paragraphs',
      title: 'Paragrafe dense care blochează extragerea automată a textului',
      severity: 'critical',
      explanation: 'Ai blocuri de text lungi care sunt adesea trunchiate sau evaluate drept redundante de parserul ATS.',
      howToFix: 'Sparge paragrafele lungi în bullet points concise de maximum 1-2 rânduri fiecare.',
      isTeaserVisible: allIssues.length < 3,
    })
  }

  // Issue 7: Low word count
  if (wordCount < 250) {
    allIssues.push({
      id: 'short_resume',
      title: 'Volum insuficient de conținut pentru parsare ATS',
      severity: 'critical',
      explanation: `CV-ul tău are doar ~${wordCount} cuvinte. Este prea scurt pentru a acoperi densitatea minimă de termeni tehnici căutați.`,
      howToFix: 'Detaliază responsabilitățile, tehnologiile utilizate și proiectele relevante pentru a atinge minimum 350-500 cuvinte.',
      isTeaserVisible: allIssues.length < 3,
    })
  }

  // Guarantee at least 3 visible issues and remaining locked
  const lockedCandidates: { title: string; category: string }[] = [
    { title: 'Densitate scăzută de cuvinte cheie specifice industriei țintă', category: 'Cuvinte Cheie' },
    { title: 'Formatare neconformă a datelor calendaristice (perioade ambiguu parsate)', category: 'Structură' },
    { title: 'Risc de confuzie în parsarea tabelelor sau coloanelor multiple', category: 'Formatare' },
    { title: 'Repetiție frecventă a verbelor generice („ajutat”, „lucrat”)', category: 'Claritate' },
    { title: 'Absența certificărilor și cursurilor recunoscute în domeniu', category: 'Impact' },
    { title: 'Lungimea nealiniată cu standardul de 1 pagină per deceniu de experiență', category: 'Formatare' },
    { title: 'Lipsa secțiunii de limbi străine conform cadrului european CEFR', category: 'Structură' },
  ]

  // Visible issues: take first 3
  const visibleIssues = allIssues.slice(0, 3)

  // If we had fewer than 3, promote from generic issues
  while (visibleIssues.length < 3 && lockedCandidates.length > 0) {
    const promo = lockedCandidates.shift()!
    visibleIssues.push({
      id: `gen_${visibleIssues.length}`,
      title: promo.title,
      severity: 'warning',
      explanation: `Această deficiență din categoria ${promo.category} reduce șansele de a trece de filtrul inițial al sistemelor automate de recrutare.`,
      howToFix: 'Accesează editorul Joben pentru a aplica corecția automată conform ghidului ATS.',
      isTeaserVisible: true,
    })
  }

  return {
    overallScore,
    grade,
    wordCount,
    characterCount,
    categories: {
      ats_formatting: {
        score: formattingScore,
        max: 25,
        label: 'Formatare & Parsabilitate ATS',
      },
      structure: {
        score: structureScore,
        max: 25,
        label: 'Structură & Secțiuni Cheie',
      },
      keyword_impact: {
        score: keywordScore,
        max: 25,
        label: 'Impact & Rezultate Măsurabile',
      },
      clarity: {
        score: clarityScore,
        max: 25,
        label: 'Claritate & Concizie',
      },
    },
    visibleIssues,
    lockedIssuesCount: 7,
    lockedIssuesPreview: lockedCandidates.slice(0, 7),
    metricsFoundCount,
    detectedSections,
    missingSections,
    hasLinkedIn,
    hasPhone,
    hasEmail,
  }
}
