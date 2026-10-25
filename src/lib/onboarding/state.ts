// Onboarding state stored in users.onboarding (JSONB). Pure helpers only, so
// they can be unit-tested and shared by server actions and client components.
export const TOUR_IDS = ['dashboard', 'resumes', 'editor', 'coverLetters', 'aiReview'] as const
export type TourId = (typeof TOUR_IDS)[number]

export type OnboardingState = {
  legacy: boolean
  tours: Partial<Record<TourId, string>>
  checklistDismissedAt: string | null
}

// Returned when the visitor is signed out or the state cannot be read: it never
// starts a tour, so a database error cannot spam anyone with one.
export const NO_TOUR_STATE: OnboardingState = { legacy: true, tours: {}, checklistDismissedAt: null }

export function isTourId(value: unknown): value is TourId {
  return typeof value === 'string' && (TOUR_IDS as readonly string[]).includes(value)
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
}

export function parseOnboarding(raw: unknown): OnboardingState {
  const obj = asRecord(raw)
  const tours: OnboardingState['tours'] = {}
  for (const [key, value] of Object.entries(asRecord(obj.tours))) {
    if (isTourId(key) && typeof value === 'string') tours[key] = value
  }
  return {
    legacy: obj.legacy === true,
    tours,
    checklistDismissedAt: typeof obj.checklistDismissedAt === 'string' ? obj.checklistDismissedAt : null,
  }
}

// Read-modify-write on one JSONB value. ponytail: no row lock, two tabs finishing
// two different tours in the same instant could lose one mark (the tour would
// show once more); use jsonb_set in an RPC if that ever matters.
export function withTourSeen(raw: unknown, tourId: TourId, nowIso: string): Record<string, unknown> {
  const obj = asRecord(raw)
  const tours = asRecord(obj.tours)
  return { ...obj, tours: { ...tours, [tourId]: typeof tours[tourId] === 'string' ? tours[tourId] : nowIso } }
}

export function withChecklistDismissed(raw: unknown, nowIso: string): Record<string, unknown> {
  return { ...asRecord(raw), checklistDismissedAt: nowIso }
}

export function shouldAutoStart(input: { state: OnboardingState; tourId: TourId; isDesktop: boolean }): boolean {
  return input.isDesktop && !input.state.legacy && !input.state.tours[input.tourId]
}
