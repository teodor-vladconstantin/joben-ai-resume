import { AppNav } from '@/components/shell/AppNav'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex flex-col min-w-0">

        <main className="grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto w-full">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="mb-8 rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-1 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 rounded-lg overflow-hidden border border-border divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-48 w-full" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-6 space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
