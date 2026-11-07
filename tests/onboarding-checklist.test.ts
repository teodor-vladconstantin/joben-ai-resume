import { describe, expect, it } from 'vitest'
import { getChecklistItems } from '@/lib/onboarding/checklist'

const labels = { resume: 'R', aiReview: 'A', coverLetter: 'C', pdfExport: 'P' }
const none = { resumes: 0, coverLetters: 0, aiReviews: 0, pdfExports: 0 }
const done = (stats: Parameters<typeof getChecklistItems>[0]) =>
  Object.fromEntries(getChecklistItems(stats, labels).map((i) => [i.key, i.done]))

describe('getChecklistItems', () => {
  it('lists the four items in order with hrefs and labels', () => {
    expect(getChecklistItems(none, labels)).toEqual([
      { key: 'resume', done: false, href: '/resumes/new', label: 'R' },
      { key: 'aiReview', done: false, href: '/ai-review', label: 'A' },
      { key: 'coverLetter', done: false, href: '/cover-letters/new', label: 'C' },
      { key: 'pdfExport', done: false, href: '/resumes', label: 'P' },
    ])
  })

  it('marks nothing done for an empty account', () => {
    expect(getChecklistItems(none, labels).filter((i) => i.done)).toHaveLength(0)
  })

  it('maps each stat to its own item', () => {
    expect(done({ ...none, resumes: 1 })).toEqual({ resume: true, aiReview: false, coverLetter: false, pdfExport: false })
    expect(done({ ...none, aiReviews: 2 })).toEqual({ resume: false, aiReview: true, coverLetter: false, pdfExport: false })
    expect(done({ ...none, coverLetters: 3 })).toEqual({ resume: false, aiReview: false, coverLetter: true, pdfExport: false })
    expect(done({ ...none, pdfExports: 1 })).toEqual({ resume: false, aiReview: false, coverLetter: false, pdfExport: true })
  })

  it('counts four done when every stat is positive', () => {
    const items = getChecklistItems({ resumes: 1, coverLetters: 1, aiReviews: 1, pdfExports: 1 }, labels)
    expect(items.filter((i) => i.done)).toHaveLength(4)
  })
})
