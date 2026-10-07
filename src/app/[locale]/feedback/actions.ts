'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Validation mirrors the `feedback` table constraints (see
// migrations/feedback.sql). likes/improvements are required free text; nps is
// the 0-10 recommendation score.
const feedbackSchema = z.object({
  likes: z.string().trim().min(1).max(5_000),
  improvements: z.string().trim().min(1).max(5_000),
  nps: z.number().int().min(0).max(10),
})

// Errors are returned as codes; the form maps them to localized copy.
export type FeedbackResult =
  | { status: 'success' }
  | { status: 'already' }
  | { status: 'error'; code: 'signIn' | 'invalid' | 'generic' }

export async function submitFeedback(input: {
  likes: string
  improvements: string
  nps: number
}): Promise<FeedbackResult> {
  // Never trust the client for identity — re-derive user + email from Clerk.
  const { userId } = await auth()
  if (!userId) {
    return { status: 'error', code: 'signIn' }
  }

  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { status: 'error', code: 'invalid' }
  }

  const user = await currentUser()
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? null

  const supabase = createServerClient()

  // One submission per user. maybeSingle() returns null (no error) when the
  // user has not submitted yet.
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    return { status: 'already' }
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: userId,
    user_email: userEmail,
    likes: parsed.data.likes,
    improvements: parsed.data.improvements,
    nps: parsed.data.nps,
  })

  if (error) {
    logger.error('Feedback insert failed', {
      source: 'submitFeedback',
      userId,
      error: error.message,
    })
    return { status: 'error', code: 'generic' }
  }

  return { status: 'success' }
}
