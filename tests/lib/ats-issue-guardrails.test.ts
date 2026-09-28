import { describe, expect, it } from 'vitest'
import { stripFalsePositiveIssues } from '@/lib/ats-issue-guardrails'

describe('stripFalsePositiveIssues', () => {
  it('drops overlap, truncation and duration-math issues, keeps real ones', () => {
    const result = stripFalsePositiveIssues({
      overall_score: 60,
      issues: [
        { issue: "Current Emerson role dated July 2025–Present with duration '1 year 2 months' is mathematically impossible", explanation: 'x' },
        { issue: 'Resume ends mid-sentence in final role', explanation: 'suggests truncation' },
        { issue: 'Overlapping concurrent roles lack clarity on time allocation', explanation: 'x' },
        { issue: 'Multiple roles lack quantifiable metrics', explanation: 'Bullets describe tasks without numbers.' },
      ],
    })
    expect(result.overall_score).toBe(60)
    expect(result.issues.map((i) => i.issue)).toEqual(['Multiple roles lack quantifiable metrics'])
  })

  it('filters analyze fields and ignores CV quotes in examples', () => {
    const result = stripFalsePositiveIssues(
      {
        improvements: [
          { issue: 'Roles overlap without clarity', weak_example: 'a', strong_example: 'b' },
          { issue: 'Weak action verbs', weak_example: 'Managed part-time staff', strong_example: 'Led 6 staff' },
        ],
        ats_warnings: [
          'Resume appears truncated',
          'Uses a two-column table layout',
          'Contact details rely on icons that ATS cannot read',
          'Decorative fonts and colors may confuse parsers',
          // Seen live on 2026-09-28 against a CV with valid 2026 dates:
          'Education entry missing graduation year; add for completeness',
          'Phone number not in standard international format (+40 700 000 000 is valid but could be clearer)',
          'AWS Cloud Practitioner cert dated Aug 2026 is recent; ensure it is actually earned and not a placeholder',
          'No GPA, honors, or academic achievements listed',
        ],
      },
      ['improvements', 'ats_warnings']
    )
    expect(result.improvements.map((i) => i.issue)).toEqual(['Weak action verbs'])
    expect(result.ats_warnings).toEqual(['Uses a two-column table layout'])
  })

  it('passes through non-object results untouched', () => {
    expect(stripFalsePositiveIssues(null)).toBeNull()
    expect(stripFalsePositiveIssues({ foo: 1 })).toEqual({ foo: 1 })
  })
})
