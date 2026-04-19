import { describe, expect, it } from 'vitest'
import { parseResumeTextToData, reconstructLines } from '@/lib/resume-parser'

describe('resume parser multilingual support', () => {
  it('reconstructs lines from mixed coordinates', () => {
    const lines = reconstructLines([
      { str: 'Ion', x: 10, y: 200 },
      { str: 'Popescu', x: 40, y: 200 },
      { str: 'Software Engineer', x: 10, y: 190 },
    ])

    expect(lines).toEqual(['Ion Popescu', 'Software Engineer'])
  })

  it('maps romanian section headers and parses experience bullets', () => {
    const input = [
      'Ion Popescu',
      'Software Engineer',
      'ion.popescu@example.com',
      '+40 712 123 456',
      'EXPERIENTA PROFESIONALA',
      'Perioada: 2022 - Present',
      'Functia: Software Engineer',
      'Angajator: Acme SRL',
      'Atributii:',
      '- Built internal tooling for recruiters',
      '- Reduced report generation time by 40%',
      'EDUCATIE SI FORMARE',
      'Universitatea Politehnica Bucuresti',
      'Licenta in Informatica (2018 - 2022)',
      'ABILITATI',
      'TypeScript, Next.js, SQL',
    ]

    const parsed = parseResumeTextToData(input)

    expect(parsed.personal.firstName).toBe('Ion')
    expect(parsed.personal.lastName).toBe('Popescu')
    expect(parsed.personal.email).toContain('ion.popescu@example.com')

    expect(parsed.experience.length).toBeGreaterThan(0)
    expect(parsed.experience[0]?.title.toLowerCase()).toContain('software')
    expect(parsed.experience[0]?.company.toLowerCase()).toContain('acme')
    expect(parsed.experience[0]?.bullets?.length || 0).toBeGreaterThan(0)

    const dynamicSections = parsed.dynamicSections || []
    const educationSection = dynamicSections.find((section) => section.type === 'education')
    const skillsSection = dynamicSections.find((section) => section.type === 'skills')

    expect(educationSection).toBeTruthy()
    expect(skillsSection).toBeTruthy()
    expect(skillsSection?.content).toContain('• TypeScript')
  })
})
