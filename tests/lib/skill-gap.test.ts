import { describe, expect, it } from 'vitest'
import { computeMissingSkills, extractSkillGapInputText } from '@/lib/skill-gap'

describe('computeMissingSkills', () => {
  it('returns job skills not present in the resume', () => {
    expect(computeMissingSkills(['Python', 'SQL'], ['Python', 'Docker', 'Kubernetes'])).toEqual([
      'Docker',
      'Kubernetes',
    ])
  })

  it('matches case-insensitively', () => {
    expect(computeMissingSkills(['react'], ['React', 'Vue.js'])).toEqual(['Vue.js'])
  })

  it('dedupes job skills while preserving first-seen casing', () => {
    expect(computeMissingSkills([], ['Docker', 'docker', 'DOCKER'])).toEqual(['Docker'])
  })

  it('returns an empty array when the resume already covers every job skill', () => {
    expect(computeMissingSkills(['Python', 'Docker'], ['python', 'docker'])).toEqual([])
  })

  it('returns an empty array for an empty job skills list', () => {
    expect(computeMissingSkills(['Python'], [])).toEqual([])
  })

  it('ignores empty-string skills', () => {
    expect(computeMissingSkills([], ['', 'Docker'])).toEqual(['Docker'])
  })
})

describe('extractSkillGapInputText', () => {
  it('collects the personal summary', () => {
    const text = extractSkillGapInputText({ personal: { summary: 'Built APIs with FastAPI.' } })
    expect(text).toContain('Built APIs with FastAPI.')
  })

  it('collects content from skills-type dynamic sections only', () => {
    const text = extractSkillGapInputText({
      dynamicSections: [
        { id: '1', type: 'skills', title: 'Skills', content: 'Python, Docker' },
        { id: '2', type: 'awards', title: 'Awards', content: 'Employee of the year' },
      ],
    })
    expect(text).toContain('Python, Docker')
    expect(text).not.toContain('Employee of the year')
  })

  it('collects experience descriptions and bullets', () => {
    const text = extractSkillGapInputText({
      experience: [
        { id: '1', description: 'Backend engineer', bullets: ['Wrote Go microservices', 'Used Kubernetes'] },
      ],
    })
    expect(text).toContain('Backend engineer')
    expect(text).toContain('Wrote Go microservices')
    expect(text).toContain('Used Kubernetes')
  })

  it('collects project descriptions, bullets, and technologies', () => {
    const text = extractSkillGapInputText({
      projects: [
        {
          id: '1',
          description: 'Side project',
          bullets: ['Built a CLI tool'],
          technologies: ['Rust', 'Clap'],
        },
      ],
    })
    expect(text).toContain('Side project')
    expect(text).toContain('Built a CLI tool')
    expect(text).toContain('Rust')
    expect(text).toContain('Clap')
  })

  it('is defensive against missing or malformed fields', () => {
    expect(extractSkillGapInputText({})).toBe('')
    expect(extractSkillGapInputText({ experience: 'not-an-array' })).toBe('')
    expect(extractSkillGapInputText({ experience: [null, 42, { bullets: 'not-an-array' }] })).toBe('')
    expect(extractSkillGapInputText({ personal: null })).toBe('')
  })
})
