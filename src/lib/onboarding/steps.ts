import type { TourStep } from '@/lib/onboarding/tours'

export function selectorFor(anchor: string): string {
  return `[data-tour="${anchor}"]`
}

// Steps whose element is not on the page (an empty list has no first row, the
// ATS card only exists after a claimed scan) are skipped instead of breaking the tour.
export function resolveSteps(steps: TourStep[], hasAnchor: (anchor: string) => boolean): TourStep[] {
  return steps.filter((step) => hasAnchor(step.anchor))
}
