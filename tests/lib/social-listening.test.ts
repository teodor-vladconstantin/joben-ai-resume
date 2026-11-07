import { describe, it, expect } from 'vitest'
import {
  generateHelpfulResponseDraft,
  type SocialLead,
} from '@/lib/social-listening'

describe('Social Listening & Lead Response Engine', () => {
  const sampleLead: SocialLead = {
    source: 'reddit',
    platformUrl: 'https://reddit.com/r/programare/comments/12345/parere_cv',
    author: 'Andrei_Dev',
    subredditOrGroup: 'r/programare',
    title: 'Parere CV junior: aplic de 2 luni si nu primesc niciun raspuns',
    body: 'Salutare, am aplicat la peste 40 de joburi si nu ma suna nimeni. Oare e ceva gresit in CV?',
    matchedKeywords: ['cv', 'parere cv', 'aplicat'],
  }

  it('generates personalized, value-first response drafts', () => {
    const draft = generateHelpfulResponseDraft(sampleLead)

    expect(draft).toContain('Salut, Andrei_Dev!')
    expect(draft).toContain('ATS')
    expect(draft).toContain('joben.eu/ro/verificare-cv-ats')
    expect(draft).toContain('măsurabile')
  })

  it('avoids spammy language and focuses on actionable advice', () => {
    const draft = generateHelpfulResponseDraft(sampleLead)

    expect(draft).not.toContain('CUMPĂRĂ')
    expect(draft).not.toContain('reducere 50%')
    expect(draft).toContain('fără cont')
  })
})
