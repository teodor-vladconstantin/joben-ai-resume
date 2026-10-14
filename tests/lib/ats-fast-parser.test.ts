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
    expect(result.visibleIssues.length).toBe(3)
    expect(result.lockedIssuesCount).toBe(7)
    expect(result.categories.ats_formatting.score).toBeGreaterThan(15)
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
    expect(result.visibleIssues.length).toBe(3)
  })
})
