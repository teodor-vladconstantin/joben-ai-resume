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
async function writeRaw(userId: string, onboarding: Record<string, unknown>): Promise<void> {
  const { error } = await createServerClient()
    .from('users')
    .upsert({ clerk_id: userId, onboarding }, { onConflict: 'clerk_id' })
  if (error) {
    logger.warn('Onboarding state write failed', { source: 'onboarding', userId, error: error.message })
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const { userId } = await auth()
  if (!userId) return NO_TOUR_STATE
  const { raw, failed } = await readRaw(userId)
  return failed ? NO_TOUR_STATE : parseOnboarding(raw)
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
