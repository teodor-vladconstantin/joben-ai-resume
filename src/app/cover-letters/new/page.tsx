import { Navbar } from '@/components/ui/Navbar'
import { CoverLetterBuilder } from '@/components/cover-letter/CoverLetterBuilder'

export default function NewCoverLetterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden">
      <Navbar />
      <main className="grow pt-16 flex h-[calc(100vh-64px)]">
        <CoverLetterBuilder />
      </main>
    </div>
  )
}
