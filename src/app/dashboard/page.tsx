import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { ProfileCompletion } from '@/components/dashboard/ProfileCompletion'
import { StatCards } from '@/components/dashboard/StatCards'
import { WeeklyGoals } from '@/components/dashboard/WeeklyGoals'
import { QuickTip } from '@/components/dashboard/QuickTip'
import { RecentDocuments } from '@/components/dashboard/RecentDocuments'
import { currentUser } from '@clerk/nextjs/server'
import { Plus, FileSearch, Mail } from 'lucide-react'
import Link from 'next/link'

import { getLatestReviewSummary, getRecentDocuments, getUserDashboardStats } from '@/lib/actions/db'
import { dashboardContent } from '@/lib/dashboard-content'
import { BenchmarkChart } from '@/components/dashboard/BenchmarkChart'
import { RedeemCodeCard } from '@/components/dashboard/RedeemCodeCard'
import { getUserPlan } from '@/lib/plans'

const icons: { [key: string]: React.ElementType } = {
  Plus,
  FileSearch,
  Mail,
};

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'There'
  const userId = user?.id || 'guest'
  const userEmailHint = user?.emailAddresses?.[0]?.emailAddress

  const currentPlan = user?.id
    ? await getUserPlan(user.id, userEmailHint)
    : 'free'

  const stats = await getUserDashboardStats(userId)
  const recentDocs = await getRecentDocuments(userId)
  const latestReview = await getLatestReviewSummary(userId)

  const scoreBreakdownData = latestReview?.breakdown || {
    ats: 0,
    content: 0,
    writing: 0,
    match: 0,
    ready: 0,
  }

  const totalScore = latestReview?.totalScore || stats.averageScore || 0
  const hasReviewData = stats.aiReviews > 0 && totalScore > 0
  const latestReviewLabel = latestReview?.resumeTitle?.trim() || 'Latest Reviewed Resume'

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="mb-8" suppressHydrationWarning>
            <h1 className="text-3xl font-bold text-(--foreground) mb-2">{dashboardContent.greeting(firstName)}</h1>
            <p className="text-(--muted)">{dashboardContent.subGreeting}</p>
          </div>

          <ProfileCompletion stats={stats} />
          <RedeemCodeCard currentPlan={currentPlan} />
          <StatCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Industry Benchmark */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-2">{dashboardContent.industryBenchmark.title}</h3>
              <p className="text-sm text-(--muted) mb-6">{dashboardContent.industryBenchmark.description}</p>
              {hasReviewData ? (
                <BenchmarkChart userScore={totalScore} />
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-(--border) rounded-xl text-(--muted) text-sm">
                  {dashboardContent.industryBenchmark.noData}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border)" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6">{dashboardContent.scoreBreakdown.title}</h3>
              {hasReviewData ? (
                <>
                  <div className="space-y-5">
                     {dashboardContent.scoreBreakdown.categories.map((item, i) => {
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
                             {isWarning && <p className="text-xs text-(--accent)">Warning: Better match job keywords</p>}
                         </div>
                       );
                     })}
                  </div>
                  <p className="mt-4 text-xs text-(--muted)">Latest grade: {latestReview?.grade || 'Unknown'}</p>
                  <Link href="/ai-review" className="block mt-2 text-(--accent) text-sm font-medium hover:text-(--accent-strong)">{dashboardContent.scoreBreakdown.cta}</Link>
                </>
              ) : (
                <div className="min-h-50 grid place-items-center">
                  <div className="w-full rounded-xl border-2 border-dashed border-(--border) px-4 py-10 text-center text-sm text-(--muted)">
                    {dashboardContent.scoreBreakdown.noData}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {dashboardContent.quickActions.map((action, index) => {
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

          {/* Bottom 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Your Score Circular Gauge */}
            <div className="bg-(--surface) p-6 rounded-2xl border border-(--border) flex flex-col items-center justify-center text-center" suppressHydrationWarning>
              <h3 className="text-lg font-bold text-(--foreground) mb-6 w-full text-left">{dashboardContent.yourScore.title}</h3>
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
                  <p className="text-(--accent) font-bold uppercase tracking-wider text-sm mb-1">{latestReview?.grade || 'Good'}</p>
                  <p className="text-(--muted) text-xs mb-4">{latestReviewLabel}</p>
                  <Link href="/ai-review" className="text-(--accent) hover:text-(--accent-strong) text-sm font-medium">{dashboardContent.yourScore.cta}</Link>
                </>
              ) : (
                <div className="w-full grow flex flex-col items-center justify-center text-(--muted)">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-(--border) flex items-center justify-center mb-4">
                    <span className="text-xl">{dashboardContent.yourScore.noDataSub}</span>
                  </div>
                  <p className="text-sm">{dashboardContent.yourScore.noData}</p>
                </div>
              )}
            </div>

            <WeeklyGoals stats={stats} />
            <QuickTip />
          </div>

          <RecentDocuments recentDocs={recentDocs} />
        </main>
      </div>
    </div>
  )
}
