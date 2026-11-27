import { describe, expect, it } from 'vitest'
import { getExperienceBullets, normalizeExperienceBullets } from '@/lib/experience-bullets'

// getExperienceBullets feeds the editor's controlled textareas on every keystroke,
// so it must hand back exactly what the user typed.
describe('getExperienceBullets', () => {
  it('keeps the trailing space of the only filled bullet', () => {
    expect(getExperienceBullets({ bullets: ['Led the '] })).toEqual(['Led the '])
  })

  it('keeps a new empty bullet next to the only filled one', () => {
    expect(getExperienceBullets({ bullets: ['Led the team', ''] })).toEqual(['Led the team', ''])
  })

  it('does not split a bullet into sentences while it is being typed', () => {
    expect(getExperienceBullets({ bullets: ['Led the team. Then'] })).toEqual(['Led the team. Then'])
  })

  it('falls back to the description when there are no bullets', () => {
    expect(getExperienceBullets({ description: 'First\nSecond' })).toEqual(['First', 'Second'])
    expect(getExperienceBullets({ bullets: [] })).toEqual([''])
  })
})

describe('normalizeExperienceBullets on load', () => {
  it('still splits a single combined bullet', () => {
    expect(normalizeExperienceBullets(['First\nSecond', ''], '', { keepEmpty: true })).toEqual(['First', 'Second'])
  })
})
