"use client"
import { useRef, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'

type Props = {
  onStartBlank: (firstName: string, lastName: string, title: string) => void
  onImported: (data: ResumeTemplateData) => void
}

type Step = 'choose' | 'blank-form' | 'importing' | 'error'

export function ResumeOnboardingModal({ onStartBlank, onImported }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePdfSelect = async (file: File) => {
    setStep('importing')
    try {
      const data = await importPdfClientSide(file)
      onImported(data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setStep('error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handlePdfSelect(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') void handlePdfSelect(file)
  }

  const handleBlankSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartBlank(firstName.trim(), lastName.trim(), jobTitle.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">

        {step === 'choose' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Create your resume</h2>
            <p className="text-white/50 text-sm mb-8">Start from scratch or import an existing PDF resume.</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep('blank-form')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-center group"
              >
                <FileText className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                <div>
                  <p className="text-white font-medium text-sm">Start from scratch</p>
                  <p className="text-white/40 text-xs mt-1">Build a new resume</p>
                </div>
              </button>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all text-center group cursor-pointer"
              >
                <Upload className="w-8 h-8 text-white/60 group-hover:text-white transition-colors" />
                <div>
                  <p className="text-white font-medium text-sm">Import PDF</p>
                  <p className="text-white/40 text-xs mt-1">AI parses your resume</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </>
        )}

        {step === 'blank-form' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Let&apos;s get started</h2>
            <p className="text-white/50 text-sm mb-8">Just the basics — you&apos;ll fill in everything else in the editor.</p>

            <form onSubmit={handleBlankSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wide">First Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/60 text-xs font-medium uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs font-medium uppercase tracking-wide">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Open Editor
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
            <div className="text-center">
              <p className="text-white font-medium">Importing your resume&hellip;</p>
              <p className="text-white/40 text-sm mt-1">AI is extracting your information</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-white font-medium">Import failed</p>
              <p className="text-white/50 text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => setStep('blank-form')}
                className="flex-1 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                Start from scratch
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
