import { Sidebar } from '@/components/dashboard/Sidebar'
import { Navbar } from '@/components/ui/Navbar'
import { Skeleton } from '@/components/ui/Skeleton'

export default function AiReviewLoading() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="grow pt-24 lg:pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto w-full">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="mb-6 grid grid-cols-1 border border-(--border) divide-y divide-(--border) sm:grid-cols-2 sm:divide-y-0 sm:divide-x md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border border-(--border) p-5 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
          </div>

          <div className="border border-(--border) p-5 space-y-4">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border border-(--border) space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
