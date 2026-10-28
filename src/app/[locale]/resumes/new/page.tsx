import { Navbar } from '@/components/ui/Navbar'
import { ResumeBuilderMount } from '@/components/builder/ResumeBuilderMount'
import { ResumeWizard } from '@/components/builder/ResumeWizard'

// The wizard is the default entry. Any query param (blank, source=ai-review,
// import flows) keeps opening the editor directly, as before.
export default async function NewResumePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const showEditor = Object.keys(await searchParams).length > 0
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Navbar />
      </div>
      {showEditor ? (
        <main className="grow min-h-0 pt-16 flex h-[calc(100vh-64px)] print:pt-0 print:h-auto print:block" suppressHydrationWarning>
          <ResumeBuilderMount />
        </main>
      ) : (
        <main className="grow min-h-0 overflow-y-auto pt-16">
          <ResumeWizard />
        </main>
      )}
    </div>
  )
}
