import { describe, expect, it } from 'vitest'

import { renderAccountExportPdf } from '@/lib/account-export-pdf'

describe('renderAccountExportPdf', () => {
  it('renders a valid PDF from export data, including Romanian text', async () => {
    const bytes = await renderAccountExportPdf({
      exportedAt: '2026-11-07T10:00:00.000Z',
      account: { email: 'a@example.com', first_name: 'Ștefan', last_name: 'Țuțu', plan: 'free', created_at: '2026-01-01T00:00:00Z' },
      resumes: [{ title: 'CV Dezvoltator', score: 82, updated_at: '2026-10-01T00:00:00Z' }],
      coverLetters: [],
      aiReviews: [{ score: 70, created_at: '2026-10-02T00:00:00Z' }],
      resumeAnalyses: [],
      feedback: [],
      legalAcceptances: [{ accepted_at: '2026-11-06T00:00:00Z', doc_version: '2026-11-06', source: 'signup' }],
      withdrawalRequests: [],
      referralsMade: [],
      referralsReceived: [],
    })
    const head = new TextDecoder().decode(new Uint8Array(bytes).slice(0, 5))
    expect(head).toBe('%PDF-')
    expect(bytes.byteLength).toBeGreaterThan(1000)
  })
})
