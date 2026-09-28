import { describe, expect, it } from 'vitest'
import { mapLlamaParseToTemplate } from '@/lib/pdf-import'

describe('mapLlamaParseToTemplate', () => {
  it('keeps every parsed field the builder can hold', () => {
    const data = mapLlamaParseToTemplate({
      full_name: 'Ana Maria Pop',
      headline: 'Senior Backend Engineer',
      website: 'anapop.dev',
      work_experience: [
        {
          company: 'Acme',
          role: 'Engineer',
          start_date: '2020-01',
          end_date: 'Present',
          start_month: 1,
          start_year: 2020,
          is_current: true,
          description: 'Owned the billing platform end to end.',
          bullets: ['Cut invoice latency by 40%', 'Mentored 3 engineers'],
        },
        { company: null, role: null, start_date: null, end_date: null, description: null, bullets: [] },
      ],
      education: [
        { institution: 'UPB', degree: 'BSc', field: 'CS', location: 'Bucharest', description: 'GPA 9.5', start_date: null, end_date: null },
      ],
      languages: [{ language: 'Romanian', level: null }],
      additional_sections: [
        { title: 'Volunteering', content: 'Red Cross, 2019' },
        { title: 'Awards', content: 'Hackathon winner' },
        { title: 'Interests', content: '' },
      ],
    })

    expect(data.personal.title).toBe('Senior Backend Engineer')
    expect(data.personal.website).toBe('anapop.dev')
    expect(data.experience).toHaveLength(1)
    expect(data.experience[0].bullets).toEqual([
      'Owned the billing platform end to end.',
      'Cut invoice latency by 40%',
      'Mentored 3 engineers',
    ])
    expect(data.experience[0].startYear).toBe(2020)
    expect(data.education?.[0]).toMatchObject({ location: 'Bucharest', description: 'GPA 9.5' })
    expect(data.dynamicSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'languages', content: 'Romanian' }),
        expect.objectContaining({ type: 'leadership', title: 'Volunteering', content: 'Red Cross, 2019' }),
        expect.objectContaining({ type: 'awards', title: 'Awards' }),
      ])
    )
    expect(data.dynamicSections?.some((section) => section.title === 'Interests')).toBe(false)
  })

  it('does not duplicate an intro the parser already turned into a bullet', () => {
    // Real parser output seen live: bullets lose the trailing period, the description keeps it.
    const data = mapLlamaParseToTemplate({
      work_experience: [
        {
          company: 'Acme',
          role: 'Engineer',
          start_date: null,
          end_date: null,
          description: 'Worked in a cross-functional squad to ship features.',
          bullets: ['Worked in a cross-functional squad to ship features', 'Led the payments service'],
        },
      ],
    })
    expect(data.experience[0].bullets).toEqual(['Worked in a cross-functional squad to ship features', 'Led the payments service'])
  })

  it('does not duplicate a description the bullets were split from', () => {
    const data = mapLlamaParseToTemplate({
      work_experience: [
        {
          company: 'Acme',
          role: 'Engineer',
          start_date: null,
          end_date: null,
          description: 'Built the API.\nShipped the mobile app.',
          bullets: [],
        },
      ],
    })
    expect(data.experience[0].bullets).toEqual(['Built the API.', 'Shipped the mobile app.'])
  })
})
