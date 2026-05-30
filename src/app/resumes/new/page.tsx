import { Navbar } from '@/components/ui/Navbar'
import { ResumeBuilderMount } from '@/components/builder/ResumeBuilderMount'

export default function NewResumePage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden print:bg-white print:overflow-visible">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="grow min-h-0 pt-16 flex h-[calc(100vh-64px)] print:pt-0 print:h-auto print:block" suppressHydrationWarning>
        <ResumeBuilderMount />
      </main>
    </div>
  )
}
