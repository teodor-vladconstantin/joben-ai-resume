// Signup survey stored in users.onboarding.survey (JSONB). Pure helpers only.
export const SURVEY_CHOICES = {
  source: ['reddit', 'linkedin', 'friend', 'google', 'ai', 'university', 'other'],
  intent: ['ats_check', 'rewrite_bullets', 'english_cv', 'new_cv', 'specific_job', 'other'],
  goal: ['first_internship', 'first_job', 'new_job', 'interview', 'other'],
} as const

export type SurveyQuestion = keyof typeof SURVEY_CHOICES
export const QUESTION_ORDER: readonly SurveyQuestion[] = ['source', 'intent', 'goal']
export const MAX_SURVEY_TEXT = 200

export type SurveyAnswer = { question: SurveyQuestion; choice: string; text?: string }
export type SurveyState = { answered: SurveyQuestion[]; shown: boolean; closed: boolean }

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
}

export function parseSurvey(raw: unknown): SurveyState {
  const survey = asRecord(asRecord(raw).survey)
  const answers = asRecord(survey.answers)
  return {
    answered: QUESTION_ORDER.filter((question) => question in answers),
    shown: typeof survey.shownAt === 'string',
    closed: typeof survey.dismissedAt === 'string' || typeof survey.completedAt === 'string',
  }
}

export function validateAnswer(question: unknown, choice: unknown, text: unknown): SurveyAnswer | null {
  const known = QUESTION_ORDER.find((q) => q === question)
  if (!known || typeof choice !== 'string') return null
  if (!(SURVEY_CHOICES[known] as readonly string[]).includes(choice)) return null
  const clean = choice === 'other' && typeof text === 'string' ? text.trim().slice(0, MAX_SURVEY_TEXT) : ''
  return clean ? { question: known, choice, text: clean } : { question: known, choice }
}

function withSurvey(raw: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const obj = asRecord(raw)
  return { ...obj, survey: { ...asRecord(obj.survey), ...patch } }
}

export function withSurveyShown(raw: unknown, locale: 'ro' | 'en', nowIso: string): Record<string, unknown> {
  return parseSurvey(raw).shown ? asRecord(raw) : withSurvey(raw, { shownAt: nowIso, locale })
}

export function withSurveyAnswer(raw: unknown, answer: SurveyAnswer, nowIso: string): Record<string, unknown> {
  const { question, ...value } = answer
  const answers = { ...asRecord(asRecord(asRecord(raw).survey).answers), [question]: { ...value, at: nowIso } }
  const complete = QUESTION_ORDER.every((q) => q in answers)
  return withSurvey(raw, complete ? { answers, completedAt: nowIso } : { answers })
}

export function withSurveyDismissed(raw: unknown, nowIso: string): Record<string, unknown> {
  return withSurvey(raw, { dismissedAt: nowIso })
}
