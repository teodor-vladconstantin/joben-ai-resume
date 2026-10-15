import { describe, it, expect } from 'vitest'
import { analyzeResumeTextLightweight } from '@/lib/ats-fast-parser'

describe('analyzeResumeTextLightweight', () => {
  it('analyzes a good resume with metrics and sections correctly', () => {
    const resumeText = `
      Ion Popescu
      Email: ion.popescu@gmail.com | Telefon: 0722123456 | LinkedIn: linkedin.com/in/ionpopescu
      București, România

      Sumar Profesional
      Inginer Software cu peste 5 ani experiență în dezvoltarea de aplicații scalabile.

      Experiență Profesională
      Senior Software Developer | Tech Corp | 2021 - Prezent
      - Dezvoltat arhitectura de microservicii și crescut performanța cu 45%
      - Optimizat timpul de răspuns al bazei de date cu 30% pentru peste 100k utilizatori
      - Coordonat o echipă de 6 dezvoltatori și livrat proiecte de 200k EUR la timp

      Educație și Studii
      Universitatea Politehnica din București | 2016 - 2020
      Licență în Calculatoare și Tehnologia Informației

      Abilități și Competențe
      TypeScript, React, Node.js, Next.js, PostgreSQL, Docker, AWS
    `

    const result = analyzeResumeTextLightweight(resumeText)

    expect(result.overallScore).toBeGreaterThanOrEqual(65)
    expect(result.hasEmail).toBe(true)
    expect(result.hasPhone).toBe(true)
    expect(result.hasLinkedIn).toBe(true)
    expect(result.metricsFoundCount).toBeGreaterThanOrEqual(2)
    expect(result.categories.ats_formatting.score).toBeGreaterThan(15)
    const ids = result.issues.map((i) => i.id)
    expect(ids).not.toContain('missing_email')
    expect(ids).not.toContain('missing_linkedin')
    expect(ids).not.toContain('missing_skills_section')
    expect(ids).not.toContain('lack_of_metrics')
  })

  it('only reports issues that are actually present (no placeholders)', () => {
    const withLanguages = `
      Experience
      Led a team of 5 people and increased sales by 20% in 2021 and 2022.
      Skills: Excel
      Languages: English C1, German B2
      Certifications: PMP
    `
    const ids = analyzeResumeTextLightweight(withLanguages).issues.map((i) => i.id)
    expect(ids).not.toContain('missing_languages')
    expect(ids).not.toContain('missing_certifications')
    expect(ids).not.toContain('missing_experience_section')
  })

  it('counts "Am <verb>" as an action verb and flags repeated generic starts', () => {
    const text = [
      'Am coordonat echipa',
      'Am implementat fluxul',
      'Responsabil cu rapoartele',
      'Am lucrat la facturi',
    ].join('\n')
    const result = analyzeResumeTextLightweight(text)
    const passive = result.issues.find((i) => i.id === 'passive_verbs')
    expect(passive?.params?.count).toBe(2)
    expect(result.issues.find((i) => i.id === 'generic_verbs')?.params?.count).toBe(2)
  })

  it('sorts issues by severity, critical first', () => {
    const { issues } = analyzeResumeTextLightweight('Vasile\nAm lucrat la diverse firme.')
    const ranks = issues.map((i) => ({ critical: 0, warning: 1, info: 2 })[i.severity])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it('detects missing sections and generates actionable issues for poor resumes', () => {
    const poorResumeText = `
      Vasile
      Fără contact clar.
      Am lucrat la diverse firme făcând diverse task-uri.
      Îmi place să lucrez în echipă.
    `

    const result = analyzeResumeTextLightweight(poorResumeText)

    expect(result.overallScore).toBeLessThan(50)
    expect(result.grade).toBe('Poor')
    expect(result.hasLinkedIn).toBe(false)
    expect(result.hasEmail).toBe(false)
    expect(result.issues.map((i) => i.id)).toContain('missing_email')
  })
})
