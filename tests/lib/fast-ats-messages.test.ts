import { describe, expect, it } from 'vitest'
import ro from '../../messages/ro.json'
import en from '../../messages/en.json'
import { analyzeResumeTextLightweight } from '@/lib/ats-fast-parser'

// Worst-case input triggers every rule, so every emitted id must be translated.
const everyIssue = analyzeResumeTextLightweight(
  ['Vasile', 'Responsabil cu facturi', 'Am lucrat la rapoarte', 'x '.repeat(40)].join('\n')
).issues

describe('FastAts messages', () => {
  for (const [name, messages] of [['ro', ro], ['en', en]] as const) {
    it(`${name}: every issue the parser can emit has a title`, () => {
      const issues = messages.FastAts.issues as Record<string, { title?: string }>
      for (const issue of everyIssue) {
        expect(issues[issue.id]?.title, `${name} ${issue.id}.title`).toBeTruthy()
      }
    })
  }

  it('ro and en define the same issue ids', () => {
    expect(Object.keys(ro.FastAts.issues).sort()).toEqual(Object.keys(en.FastAts.issues).sort())
  })

  it('the worst-case input emits most rules', () => {
    expect(everyIssue.length).toBeGreaterThanOrEqual(10)
  })
})
