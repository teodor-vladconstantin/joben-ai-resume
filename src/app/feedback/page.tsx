// ---------------------------------------------------------------------------
// Supabase migration for this page's `feedback` table (also in
// migrations/feedback.sql and supabase/migrations/). Run it manually if the
// table does not exist yet:
//
//   create table feedback (
//     id uuid primary key default gen_random_uuid(),
//     user_id text not null,
//     user_email text,
//     likes text not null,
//     improvements text not null,
//     nps integer not null check (nps between 0 and 10),
//     created_at timestamptz default now()
//   );
// ---------------------------------------------------------------------------

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { FeedbackForm } from './FeedbackForm'

export const metadata: Metadata = {
  title: 'Feedback | Joben',
  description: 'Share your feedback and help shape Joben during the beta.',
}

export default async function FeedbackPage() {
  // Protected route: middleware already enforces auth, but guard here too so
  // the redirect returns the user straight back to /feedback after sign-in.
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in?redirect_url=/feedback')
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''

  // If the user already submitted, render a thank-you instead of the form.
  // A missing table (migration not applied yet) leaves `existing` null and
  // falls through to the form, which surfaces a friendly error on submit.
  const supabase = createServerClient()
  const { data: existing } = await supabase
    .from('feedback')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-(--background) px-4 py-16 text-(--foreground)">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-(--accent-strong)">Beta feedback</p>
          <h1 className="mt-2 text-2xl font-semibold text-(--foreground)">Help us improve Joben</h1>
          <p className="mt-2 text-sm text-(--muted)">
            Joben is in beta. Your feedback directly shapes what we build next.
          </p>
        </header>

        <Card radius="lg" className="p-6 sm:p-8">
          {existing ? (
            <div className="rounded-lg border border-(--accent-strong)/35 bg-(--accent-muted) px-6 py-8 text-center">
              <p className="text-base font-medium text-(--foreground)">
                You&apos;ve already left feedback — thank you!
              </p>
            </div>
          ) : (
            <FeedbackForm email={email} />
          )}
        </Card>
      </div>
    </main>
  )
}
