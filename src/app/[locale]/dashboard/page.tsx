import type { Metadata } from 'next'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { ProfileCompletion } from '@/components/dashboard/ProfileCompletion'
import { StatCards } from '@/components/dashboard/StatCards'
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals'
import { QuickTip } from '@/components/dashboard/QuickTip'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { currentUser } from '@clerk/nextjs/server'
import { Plus, FileSearch, Mail } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getMessages, getTranslations } from 'next-intl/server'

import { getLatestReviewSummary, getRecentDocuments, getUserDashboardStats } from '@/lib/actions/db'
import { BenchmarkChart } from '@/components/dashboard/BenchmarkChart'
import { RedeemCodeCard } from '@/components/dashboard/RedeemCodeCard'
import { getUserPlan } from '@/lib/plans'
import type { AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

const icons: { [key: string]: React.ElementType } = {
  Plus,
  FileSearch,
  Mail,
};

// Authenticated-only page: prevent indexing if a URL ever leaks (linked
// externally, etc) since it otherwise inherits the homepage's title/OG data.
export const metadata: Metadata = {
  title: 'Dashboard | Joben',
  robots: { index: false, follow: false },
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const messages = (await getMessages({ locale })) as unknown as Messages
  const d = messages.Dashboard
  const tGrade = await getTranslations({ locale, namespace: 'Grade' })
  const gradeLabel = (grade: string | undefined | null, fallback: string) =>
    grade && grade in messages.Grade.labels ? tGrade(`labels.${grade}`) : fallback

  const user = await currentUser()
  const firstName = user?.firstName || d.guestFallbackName
  const userId = user?.id || 'guest'
  const userEmailHint = user?.emailAddresses?.[0]?.emailAddress

  const currentPlan = user?.id
    ? await getUserPlan(user.id, userEmailHint)
    : 'free'

  const stats = await getUserDashboardStats(userId)
  const recentDocs = await getRecentDocuments(userId)
  const latestReview = await getLatestReviewSummary(userId)

  // Drives the new-user empty state: hide modules that carry no signal at
  // zero (stat cards, Weekly Goals' streak, Redeem Code) and promote Quick
  // Actions to the single next step, instead of showing every module at once.
  const isNewUser = stats.resumes === 0 && stats.coverLetters === 0 && stats.aiReviews === 0

  const scoreBreakdownData = latestReview?.breakdown || {
    ats: 0,
    content: 0,
    writing: 0,
    match: 0,
    ready: 0,
  }

  const totalScore = latestReview?.totalScore || stats.averageScore || 0
  const hasReviewData = stats.aiReviews > 0 && totalScore > 0
  const latestReviewLabel = latestReview?.resumeTitle?.trim() || d.yourScore.latestReviewedFallback
  const greeting = new Date().getHours() < 12 ? d.greetingMorning : d.greetingEvening

  const quickActions = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {d.quickActions.map((action, index) => {
        const Icon = icons[action.icon];
        return (
          <Link key={index} href={action.href} className={`${
            action.isPrimary
              ? 'bg-(--accent) text-(--background) hover:bg-(--accent-strong)'
              : 'bg-(--surface) border border-(--border) text-(--foreground) hover:border-(--accent)/60'
          } p-6 rounded-2xl font-bold flex items-center justify-between transition-all`} suppressHydrationWarning>
            <span>{action.label}</span> <Icon className={`w-6 h-6 ${action.isPrimary ? '' : 'text-(--muted)'}`} />
          </Link>
        );
      })}
    </div>
  )

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-8" suppressHydrationWarning>
            <h1 className="text-3xl font-bold text-(--foreground) mb-2">{greeting}, {firstName}</h1>
            <p className="text-(--muted)">{d.subGreeting}</p>
          </div>

          <ProfileCompletion stats={stats} />
          {isNewUser && quickActions}
          {!isNewUser && <RedeemCodeCard currentPlan={currentPlan} />}
          {!isNewUser && <StatCards stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Industry Benchmark */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-2">{d.industryBenchmark.title}</h3>
              <p className="text-sm text-(--muted) mb-6">{d.industryBenchmark.description}</p>
              {hasReviewData ? (
                <BenchmarkChart userScore={totalScore} />
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-(--border) rounded-xl text-(--muted) text-sm">
                  {d.industryBenchmark.noData}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6">{d.scoreBreakdown.title}</h3>
              {hasReviewData ? (
                <>
                  <div className="space-y-5">
                     {d.scoreBreakdown.categories.map((item, i) => {
                       const score = scoreBreakdownData[item.key as keyof typeof scoreBreakdownData];
                       const isWarning = item.key === 'match' && score < 13
                       return (
                         <div key={i}>
                           <div className="flex justify-between text-sm mb-1">
                             <span className="text-(--foreground)">{item.label}</span>
                             <span className="text-(--muted)">{score}/{item.max}</span>
                           </div>
                           <div className="w-full bg-(--background) rounded-full h-2 mb-1">
                             <div className="bg-(--accent) h-2 rounded-full" style={{ width: `${Math.min((score/item.max)*100, 100)}%` }}></div>
                           </div>
                             {isWarning && <p className="text-xs text-(--accent)">{d.scoreBreakdown.warningMatch}</p>}
                         </div>
                       );
                     })}
                  </div>
                  <p className="mt-4 text-xs text-(--muted)">{d.scoreBreakdown.latestGradePrefix}{gradeLabel(latestReview?.grade, d.scoreBreakdown.unknownGrade)}</p>
                  <Link href="/ai-review" className="block mt-2 text-(--accent) text-sm font-medium hover:text-(--accent-strong)">{d.scoreBreakdown.cta}</Link>
                </>
              ) : (
                <div className="min-h-50 grid place-items-center">
                  <div className="w-full rounded-xl border-2 border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
                    {d.scoreBreakdown.noData}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (moved above, right after Profile Completion, for isNewUser) */}
          {!isNewUser && quickActions}

          {/* Bottom cards: 3-wide normally, 2-wide for isNewUser since Weekly Goals is hidden */}
          <div className={`grid grid-cols-1 ${isNewUser ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
            {/* Your Score Circular Gauge */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col items-center justify-center text-center" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6 w-full text-left">{d.yourScore.title}</h3>
              {hasReviewData ? (
                <>
                  <div
                    className="relative w-32 h-32 flex items-center justify-center rounded-full mb-4"
                    style={{
                      background: `conic-gradient(var(--accent) ${totalScore}%, color-mix(in srgb, var(--foreground) 10%, transparent) ${totalScore}% 100%)`,
                    }}
                  >
                     <div className="absolute inset-2 rounded-full bg-(--surface)" />
                     <span className="relative text-4xl font-black text-(--foreground)">{totalScore}</span>
                  </div>
                  <p className="text-(--accent) font-bold uppercase tracking-wider text-sm mb-1">{gradeLabel(latestReview?.grade, tGrade('labels.Good'))}</p>
                  <p className="text-(--muted) text-xs mb-4">{latestReviewLabel}</p>
                  <Link href="/ai-review" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium">{d.yourScore.cta}</Link>
                </>
              ) : (
                <div className="w-full grow flex flex-col items-center justify-center text-(--muted)">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-(--border) flex items-center justify-center mb-4">
                    <span className="text-xl">{d.yourScore.noDataSub}</span>
                  </div>
                  <p className="text-sm">{d.yourScore.noData}</p>
                </div>
              )}
            </div>

            {!isNewUser && <WeeklyGoals stats={stats} />}
            <QuickTip isNewUser={isNewUser} />
          </div>

          <RecentDocuments recentDocs={recentDocs} />
        </main>
      </div>
    </div>
  )
}
