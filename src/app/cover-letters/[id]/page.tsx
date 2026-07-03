import { Navbar } from '@/components/ui/Navbar'
import { CoverLetterBuilder } from '@/components/cover-letter/CoverLetterBuilder'

export default function CoverLetterEditorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020202] overflow-hidden">
      <Navbar />
      <main className="grow pt-16 flex h-[calc(100vh-64px)]">
        <CoverLetterBuilder />
      </main>
    </div>
  )
}