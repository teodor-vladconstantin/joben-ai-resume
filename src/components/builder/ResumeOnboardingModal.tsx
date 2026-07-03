"use client"
import { useRef, useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'
import { AlertModal } from '@/components/ui/AlertModal'

const MAX_FILES_PER_SLOT = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

type Props = {
  onStartBlank: (firstName: string, lastName: string, title: string) => void
  onImported: (data: ResumeTemplateData) => void
}

type Step = 'choose' | 'blank-form' | 'importing' | 'error' | 'show-alert'


function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index < 0) return ''
  return fileName.slice(index).toLowerCase()
}

function isValidResumeFile(file: File): boolean {
  const extension = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(extension)) return false
  if (!file.type) return true
  return ALLOWED_TYPES.includes(file.type)
}

export function ResumeOnboardingModal({ onStartBlank, onImported }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [uploadedImportFiles, setUploadedImportFiles] = useState<File[]>([])
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)

  const validateUploadFile = (file: File) => {
    if (!isValidResumeFile(file)) {
      setAlertMessage('Only PDF and DOCX files are allowed.')
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAlertMessage('File must be under 5 MB.')
      return false
    }

    if (uploadedImportFiles.length >= MAX_FILES_PER_SLOT) {
      setAlertMessage(`You can upload a maximum of ${MAX_FILES_PER_SLOT} CVs per slot.`)
      return false
    }

    return true
  }

  const handlePdfSelect = async (file: File) => {
    setStep('importing')
    try {
      const result = await importPdfClientSide(file)
      setUploadedImportFiles(prev => [...prev, file])
      onImported(result.data)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed. Please try again.')
      setStep('error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (validateUploadFile(file)) {
        setPendingUploadFile(file)
        setAlertMessage('For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.')
        setShowAlert(true)
      }
      // Reset input to allow selecting the same file again
      e.currentTarget.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      if (validateUploadFile(file)) {
        setPendingUploadFile(file)
        setAlertMessage('For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.')
        setShowAlert(true)
      }
    }
  }

  const handleAlertConfirm = () => {
    setShowAlert(false)
    if (pendingUploadFile) {
      void handlePdfSelect(pendingUploadFile)
    }
  }

  const handleAlertCancel = () => {
    setShowAlert(false)
    setPendingUploadFile(null)
    setStep('choose')
  }

  const handleBlankSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStartBlank(firstName.trim(), lastName.trim(), jobTitle.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-(--surface) border border-(--border) rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">

        {showAlert && (
          <AlertModal
            isOpen={showAlert}
            onConfirm={handleAlertConfirm}
            onCancel={handleAlertCancel}
            title={alertMessage}
          />
        )}

        {step === 'choose' && (
          <>
            <h2 className="text-2xl font-bold text-(--foreground) mb-2">Create your resume</h2>
            <p className="text-(--muted) text-sm mb-8">Start from scratch or import an existing PDF resume.</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep('blank-form')}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-(--border) bg-(--surface-elevated) hover:bg-(--surface-elevated) hover:border-(--accent-strong)/40 transition-all text-center group"
              >
                <FileText className="w-8 h-8 text-(--muted) group-hover:text-(--foreground) transition-colors" />
                <div>
                  <p className="text-(--foreground) font-medium text-sm">Start from scratch</p>
                  <p className="text-(--muted) text-xs mt-1">Build a new resume</p>
                </div>
              </button>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border border-dashed border-(--border) bg-(--surface-elevated) hover:bg-(--surface-elevated) hover:border-(--accent-strong)/60 transition-all text-center group cursor-pointer"
              >
                <Upload className="w-8 h-8 text-(--muted) group-hover:text-(--foreground) transition-colors" />
                <div>
                  <p className="text-(--foreground) font-medium text-sm">Import PDF</p>
                  <p className="text-(--muted) text-xs mt-1">AI parses your resume</p>
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
            <h2 className="text-2xl font-bold text-(--foreground) mb-2">Let&apos;s get started</h2>
            <p className="text-(--muted) text-sm mb-8">Just the basics — you&apos;ll fill in everything else in the editor.</p>

            <form onSubmit={handleBlankSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">First Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-(--muted) text-xs font-medium uppercase tracking-wide">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  className="bg-(--surface-elevated) border border-(--border) rounded-lg px-3 py-2.5 text-(--foreground) text-sm placeholder:text-(--muted) focus:outline-none focus:border-(--accent-strong)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--muted) text-sm hover:text-(--foreground) hover:border-(--accent-strong)/40 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-(--accent) text-(--background) text-sm font-semibold hover:bg-(--accent-strong) transition-colors"
                >
                  Open Editor
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-(--foreground) animate-spin" />
            <div className="text-center">
              <p className="text-(--foreground) font-medium">Importing your resume&hellip;</p>
              <p className="text-(--muted) text-sm mt-1">AI is extracting your information</p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-center">
              <p className="text-(--foreground) font-medium">Import failed</p>
              <p className="text-(--muted) text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-2.5 rounded-lg border border-(--border) text-(--muted) text-sm hover:text-(--foreground) hover:border-(--accent-strong)/40 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => setStep('blank-form')}
                className="flex-1 py-2.5 rounded-lg bg-(--accent) text-(--background) text-sm font-semibold hover:bg-(--accent-strong) transition-colors"
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
