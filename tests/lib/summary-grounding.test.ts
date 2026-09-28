import { describe, expect, it } from 'vitest'
import { findNewNumberClaims } from '@/lib/claim-diff'
import { careerSpanLine, extraSummaryContext, limitSentences, summarySourceText } from '@/lib/summary-grounding'

const resume = {
  personal: { title: 'Backend Engineer', summary: '' },
  experience: [
    { title: 'Engineer', company: 'Acme', period: 'Jan 2016 - Dec 2019', bullets: ['Cut latency by 40%'] },
    { title: 'Senior Engineer', company: 'Beta', startYear: 2020, period: '2020 - Present', bullets: ['Led 5 engineers'] },
  ],
  education: [{ institution: 'UPB', degree: 'BSc', field: 'Computer Science' }],
  projects: [{ name: 'ledgerlite', technologies: ['Go'], bullets: ['1.2k stars'] }],
}

describe('summary grounding', () => {
  it('tells the model the real career span and the education it used to miss', () => {
    const now = new Date('2026-09-28')
    expect(careerSpanLine(resume, now)).toBe('Career span: earliest role starts in 2016, about 10 years ago.')
    expect(extraSummaryContext(resume)).toContain('BSc, Computer Science, UPB')
    expect(extraSummaryContext(resume)).toContain('ledgerlite (Go)')
  })

  it('flags invented numbers, including spelled-out ones, but not facts from any section', () => {
    const source = summarySourceText(resume)
    expect(findNewNumberClaims('', source, 'Backend engineer who led 5 engineers and cut latency by 40%.')).toEqual([])
    expect(findNewNumberClaims('', source, 'Engineer with 15+ years who grew revenue 3x.')).toEqual(['15', '3'])
    expect(findNewNumberClaims('', source, 'Engineer with fifteen years of experience.')).toEqual(['fifteen'])
    expect(findNewNumberClaims('', source, 'Inginer cu cinci ingineri în echipă.')).toEqual([])
  })

  it('keeps three whole sentences instead of cutting at "Node.js"', () => {
    const text = 'Backend engineer working in Node.js and Go. Led 5 engineers. Cut latency by 40%. Extra sentence.'
    expect(limitSentences(text, 3)).toBe('Backend engineer working in Node.js and Go. Led 5 engineers. Cut latency by 40%.')
  })
})
