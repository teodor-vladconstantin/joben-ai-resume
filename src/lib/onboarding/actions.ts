'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  NO_TOUR_STATE,
  isTourId,
  parseOnboarding,
  withChecklistDismissed,
  withTourSeen,
  type OnboardingState,
} from '@/lib/onboarding/state'
import {
  parseSurvey,
  validateAnswer,
  withSurveyAnswer,
  withSurveyDismissed,
  withSurveyShown,
  type SurveyState,
} from '@/lib/signup-survey'

async function readRaw(userId: string): Promise<{ raw: unknown; failed: boolean }> {
  const { data, error } = await createServerClient()
    .from('users')
    .select('onboarding')
    .eq('clerk_id', userId)
    .maybeSingle()
  if (error) {
    logger.warn('Onboarding state read failed', { source: 'onboarding', userId, error: error.message })
    return { raw: null, failed: true }
  }
  return { raw: data?.onboarding ?? null, failed: false }
}

// Upsert on clerk_id: right after sign-up the Clerk webhook may not have created
// the users row yet. The webhook's own upsert never sets `onboarding`.
async function writeRaw(userId: string, onboarding: Record<string, unknown>): Promise<boolean> {
  const { error } = await createServerClient()
    .from('users')
    .upsert({ clerk_id: userId, onboarding }, { onConflict: 'clerk_id' })
  if (error) {
    logger.warn('Onboarding state write failed', { source: 'onboarding', userId, error: error.message })
  }
  return !error
}

export async function getOnboardingState(): Promise<OnboardingState> {
  try {
    const { userId } = await auth()
    if (!userId) return NO_TOUR_STATE
    const { raw, failed } = await readRaw(userId)
    return failed ? NO_TOUR_STATE : parseOnboarding(raw)
  } catch (error) {
    logger.warn('Onboarding state read threw', { source: 'onboarding', error: error instanceof Error ? error.message : String(error) })
    return NO_TOUR_STATE
  }
}

export async function markTourSeen(tourId: string): Promise<void> {
  if (!isTourId(tourId)) return
  const { userId } = await auth()
  if (!userId) return
  const { raw, failed } = await readRaw(userId)
  if (failed) return
  await writeRaw(userId, withTourSeen(raw, tourId, new Date().toISOString()))
}

export async function dismissChecklist(): Promise<void> {
  const { userId } = await auth()
  if (!userId) return
  const { raw, failed } = await readRaw(userId)
  if (failed) return
  await writeRaw(userId, withChecklistDismissed(raw, new Date().toISOString()))
}

// Signup survey (users.onboarding.survey). Next runs one tab's server actions in
// order, so its own read-modify-write calls cannot race each other.
async function readOwnRaw(): Promise<{ userId: string; raw: unknown } | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null
    const { raw, failed } = await readRaw(userId)
    return failed ? null : { userId, raw }
  } catch (error) {
    logger.warn('Signup survey read threw', { source: 'signup-survey', error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

export async function getSurveyState(): Promise<SurveyState | null> {
  const own = await readOwnRaw()
  return own ? parseSurvey(own.raw) : null
}

export async function markSurveyShown(locale: string): Promise<boolean> {
  const own = await readOwnRaw()
  if (!own || parseSurvey(own.raw).shown) return false
  return writeRaw(own.userId, withSurveyShown(own.raw, locale === 'en' ? 'en' : 'ro', new Date().toISOString()))
}

export async function saveSurveyAnswer(question: string, choice: string, text?: string): Promise<boolean> {
  const answer = validateAnswer(question, choice, text)
  if (!answer) return false
  const own = await readOwnRaw()
  if (!own) return false
  return writeRaw(own.userId, withSurveyAnswer(own.raw, answer, new Date().toISOString()))
}

export async function dismissSurvey(): Promise<boolean> {
  const own = await readOwnRaw()
  if (!own) return false
  return writeRaw(own.userId, withSurveyDismissed(own.raw, new Date().toISOString()))
}
