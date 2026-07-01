import { DashboardShell } from '@/components/layout/Sidebar'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <DashboardShell title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-surface border border-border-soft rounded-lg p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-10" />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-bg-surface border border-border-soft rounded-lg p-4">
              <Skeleton className="h-4 w-28 mb-3" />
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent resumes */}
      <div>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="bg-bg-surface border border-border-soft rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border-faint">
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="px-4 py-8 flex flex-col items-center gap-3">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-8 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
