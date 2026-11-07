import type { TourId } from '@/lib/onboarding/state'

// anchor: value of the data-tour attribute on the real element.
// key: message key under Onboarding.tours.<tourId>.<key>.{title,body}.
export type TourStep = { anchor: string; key: string }

export const TOURS: Record<TourId, TourStep[]> = {
  dashboard: [
    { anchor: 'dashboard-sidebar', key: 'sidebar' },
    { anchor: 'dashboard-create', key: 'create' },
    { anchor: 'dashboard-checklist', key: 'checklist' },
    { anchor: 'dashboard-ats', key: 'ats' },
    { anchor: 'dashboard-referral', key: 'referral' },
  ],
  resumes: [
    { anchor: 'resumes-create', key: 'create' },
    { anchor: 'resumes-row', key: 'row' },
    { anchor: 'resumes-actions', key: 'actions' },
  ],
  editor: [
    { anchor: 'editor-tabs', key: 'tabs' },
    { anchor: 'editor-import', key: 'import' },
    { anchor: 'editor-tailor', key: 'tailor' },
    { anchor: 'editor-preview', key: 'preview' },
    { anchor: 'editor-export', key: 'export' },
  ],
  coverLetters: [
    { anchor: 'letters-create', key: 'create' },
    { anchor: 'letters-row', key: 'row' },
    { anchor: 'letters-actions', key: 'actions' },
  ],
  aiReview: [
    { anchor: 'ai-upload', key: 'upload' },
    { anchor: 'ai-jd', key: 'jd' },
    { anchor: 'ai-start', key: 'start' },
    { anchor: 'ai-history', key: 'history' },
  ],
}
