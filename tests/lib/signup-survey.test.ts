import { describe, expect, it } from 'vitest'
import en from '../../messages/en.json'
import ro from '../../messages/ro.json'
import {
  MAX_SURVEY_TEXT,
  QUESTION_ORDER,
  SURVEY_CHOICES,
  parseSurvey,
  validateAnswer,
  withSurveyAnswer,
  withSurveyDismissed,
  withSurveyShown,
} from '@/lib/signup-survey'

describe('validateAnswer', () => {
  it('rejects unknown questions and choices', () => {
    expect(validateAnswer('salary', 'other', undefined)).toBeNull()
    expect(validateAnswer('toString', 'other', undefined)).toBeNull()
    expect(validateAnswer('source', 'tiktok', undefined)).toBeNull()
    expect(validateAnswer('source', 7, undefined)).toBeNull()
  })

  it('trims and caps free text, for "other" only', () => {
    expect(validateAnswer('source', 'other', `  ${'a'.repeat(300)}  `)?.text).toHaveLength(MAX_SURVEY_TEXT)
    expect(validateAnswer('source', 'other', '   ')).toEqual({ question: 'source', choice: 'other' })
    expect(validateAnswer('source', 'reddit', 'x')).toEqual({ question: 'source', choice: 'reddit' })
  })
})

describe('survey copy', () => {
  it.each([en, ro])('has a label for every question and choice', (messages) => {
    const copy = messages.Dashboard.signupSurvey
    for (const question of QUESTION_ORDER) {
      expect(copy.questions[question]).toBeTruthy()
      expect(Object.keys(copy.choices[question])).toEqual([...SURVEY_CHOICES[question]])
    }
  })
})

describe('survey state', () => {
  it('starts empty for malformed input', () => {
    const empty = { answered: [], shown: false, closed: false }
    expect(parseSurvey(null)).toEqual(empty)
    expect(parseSurvey({ survey: 'x' })).toEqual(empty)
  })

  it('records the first shown time and locale and keeps other keys', () => {
    const first = withSurveyShown({ tours: { editor: 'a' } }, 'ro', 't1')
    expect(withSurveyShown(first, 'en', 't2')).toEqual({
      tours: { editor: 'a' },
      survey: { shownAt: 't1', locale: 'ro' },
    })
  })

  it('completes after the third answer', () => {
    let raw = withSurveyAnswer({ legacy: true }, { question: 'source', choice: 'google' }, 't1')
    raw = withSurveyAnswer(raw, { question: 'intent', choice: 'new_cv' }, 't2')
    expect(parseSurvey(raw)).toEqual({ answered: ['source', 'intent'], shown: false, closed: false })
    raw = withSurveyAnswer(raw, { question: 'goal', choice: 'other', text: 'abroad' }, 't3')
    expect(raw).toMatchObject({
      legacy: true,
      survey: { completedAt: 't3', answers: { goal: { choice: 'other', text: 'abroad', at: 't3' } } },
    })
    expect(parseSurvey(raw).closed).toBe(true)
  })

  it('closes when dismissed and keeps the answers', () => {
    const raw = withSurveyDismissed(withSurveyAnswer({}, { question: 'source', choice: 'ai' }, 't1'), 't2')
    expect(parseSurvey(raw)).toEqual({ answered: ['source'], shown: false, closed: true })
  })
})
