export type ChecklistStats = { resumes: number; coverLetters: number; aiReviews: number; pdfExports: number }
export type ChecklistKey = 'resume' | 'aiReview' | 'coverLetter' | 'pdfExport'

// Activation checklist: four steps up to the first exported PDF.
export function getChecklistItems(stats: ChecklistStats, labels: Record<ChecklistKey, string>) {
  const items: { key: ChecklistKey; done: boolean; href: string }[] = [
    { key: 'resume', done: stats.resumes > 0, href: '/resumes/new' },
    { key: 'aiReview', done: stats.aiReviews > 0, href: '/ai-review' },
    { key: 'coverLetter', done: stats.coverLetters > 0, href: '/cover-letters/new' },
    { key: 'pdfExport', done: stats.pdfExports > 0, href: '/resumes' },
  ]
  return items.map((item) => ({ ...item, label: labels[item.key] }))
}
