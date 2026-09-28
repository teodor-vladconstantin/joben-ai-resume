import { describe, expect, it } from 'vitest'
import { resumeToPlainText } from '@/lib/resume-text'

describe('resumeToPlainText', () => {
  it('includes every section the AI review used to miss, with headings', () => {
    const text = resumeToPlainText({
      personal: { firstName: 'Ana', lastName: 'Pop', title: 'Engineer', email: 'a@b.ro', location: 'Iași', linkedin: 'linkedin.com/in/ana', summary: 'Backend engineer.' },
      experience: [{ title: 'Engineer', company: 'Acme', period: '2020 - Present', bullets: ['Built APIs', 'Led 3 devs'] }],
      projects: [{ name: 'ledger', technologies: ['Go'], description: 'Double-entry ledger' }],
      education: [{ institution: 'UAIC', degree: 'BSc', field: 'CS', startYear: 2016, endYear: 2019, description: 'GPA 9.5' }],
      dynamicSections: [{ type: 'languages', title: 'Limbi', content: 'Engleză (C1)' }],
    })
    expect(text).toBe(
      [
        'Ana Pop',
        'Engineer',
        'a@b.ro | Iași | linkedin.com/in/ana',
        '',
        'SUMMARY',
        'Backend engineer.',
        '',
        'EXPERIENCE',
        'Engineer, Acme | 2020 - Present',
        '- Built APIs',
        '- Led 3 devs',
        '',
        'PROJECTS',
        'ledger',
        '- Double-entry ledger',
        'Technologies: Go',
        '',
        'EDUCATION',
        'UAIC | 2016 - 2019',
        'BSc, CS',
        'GPA 9.5',
        '',
        'LIMBI',
        'Engleză (C1)',
      ].join('\n')
    )
  })

  it('returns an empty string for non-object input', () => {
    expect(resumeToPlainText(null)).toBe('')
  })
})
