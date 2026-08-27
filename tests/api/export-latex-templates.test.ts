import { describe, expect, it } from 'vitest'
import { buildHarvardLatex, buildModernLatex } from '@/app/api/resumes/export-latex/route'

function buildSampleData() {
  return {
    personal: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      title: 'Software Engineer',
      email: 'ada@example.org',
      phone: '555-0100',
      summary: 'Builds analytical engines.',
    },
    experience: [
      {
        title: 'Engineer',
        company: 'Analytical Engines Inc.',
        period: '2020 - Present',
        bullets: ['Designed the first algorithm intended for a machine.'],
      },
    ],
    education: [
      {
        institution: 'Somerville College',
        degree: 'Mathematics',
        endYear: 1840,
      },
    ],
  }
}

describe('buildHarvardLatex', () => {
  it('produces a compilable-looking document with the classic serif header', () => {
    const tex = buildHarvardLatex(buildSampleData())
    expect(tex).toContain('\\documentclass')
    expect(tex).toContain('\\end{document}')
    expect(tex).toContain('Ada Lovelace')
    expect(tex).toContain('\\scshape')
    expect(tex).toContain('\\titlerule')
    expect(tex).not.toContain('\\definecolor{accent}')
  })
})

describe('buildModernLatex', () => {
  it('produces a compilable-looking document with the accent-colored sans-serif header', () => {
    const tex = buildModernLatex(buildSampleData())
    expect(tex).toContain('\\documentclass')
    expect(tex).toContain('\\end{document}')
    expect(tex).toContain('Ada Lovelace')
    expect(tex).toContain('\\definecolor{accent}{HTML}{1D4ED8}')
    expect(tex).toContain('\\usepackage{helvet}')
    expect(tex).not.toContain('\\scshape')
  })

  it('still renders the same content sections as Harvard (experience, education)', () => {
    const tex = buildModernLatex(buildSampleData())
    expect(tex).toContain('Analytical Engines Inc.')
    expect(tex).toContain('Designed the first algorithm intended for a machine.')
    expect(tex).toContain('Somerville College')
  })
})
