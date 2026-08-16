"use client"

import { useRef, useState } from 'react'
import { Upload, Loader2, AlertTriangle, CheckCircle2, RotateCcw, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { ResumeScoreHero } from '@/components/landing/ResumeScoreHero'

type AtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'

type AtsCategory = { score: number; max: number }

type AtsIssue = { issue: string; explanation: string }

type AtsResult = {
  overall_score: number
  grade: 'Poor' | 'Fair' | 'Good' | 'Excellent'
  categories: Record<AtsCategoryKey, AtsCategory>
  issues: AtsIssue[]
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const CATEGORY_ORDER: AtsCategoryKey[] = ['ats_formatting', 'structure', 'keyword_impact', 'clarity']

const CATEGORY_LABELS: Record<AtsCategoryKey, string> = {
  ats_formatting: 'ATS Formatting',
  structure: 'Structure',
  keyword_impact: 'Keywords & Impact',
  clarity: 'Clarity',
}

// Decision to confirm: only the keyword_impact -> "15 free AI bullet rewrites"
// mapping was given explicitly in the spec. The other three categories are my
// extrapolation, matched to the closest real free-plan feature (ATS-optimized
// template for structure/formatting, bullet rewrites for clarity too since
// that feature also tightens wording).
const CTA_BY_CATEGORY: Record<AtsCategoryKey, { headline: string; cta: string }> = {
  keyword_impact: {
    headline: 'Your bullets are missing the numbers and outcomes recruiters scan for.',
    cta: 'Fix this automatically with 15 free AI bullet rewrites',
  },
  clarity: {
    headline: 'Your bullets could be tighter and easier to scan.',
    cta: 'Sharpen your bullets with 15 free AI rewrites',
  },
  structure: {
    headline: "Your sections aren't in the order ATS software expects.",
    cta: 'Rebuild it with a free ATS-optimized template',
  },
  ats_formatting: {
    headline: 'Formatting choices here could trip up ATS parsers.',
    cta: 'Get a clean, parser-friendly resume, free',
  },
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

function getWorstCategory(categories: Record<AtsCategoryKey, AtsCategory>): AtsCategoryKey {
  return CATEGORY_ORDER.reduce((worst, key) => {
    const ratio = categories[key].score / categories[key].max
    const worstRatio = categories[worst].score / categories[worst].max
    return ratio < worstRatio ? key : worst
  }, CATEGORY_ORDER[0])
}

export function FreeAtsCheckerClient() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [email, setEmail] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [result, setResult] = useState<AtsResult | null>(null)

  function handleFile(selected: File) {
    setError(null)
    setIsRateLimited(false)

    const extension = getExtension(selected.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Only .pdf and .docx files are supported.')
      setFile(null)
      return
    }

    if (selected.size > MAX_UPLOAD_BYTES) {
      setError('File exceeds the 5 MB limit.')
      setFile(null)
      return
    }

    setFile(selected)
  }

  async function handleScan() {
    if (!file) return

    setIsScanning(true)
    setError(null)
    setIsRateLimited(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (email.trim()) {
        formData.append('email', email.trim())
      }

      const response = await fetch('/api/public/ats-check', {
        method: 'POST',
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as
        | { result?: AtsResult; error?: string }
        | null

      if (!response.ok) {
        if (response.status === 429) {
          setIsRateLimited(true)
        } else {
          setError(payload?.error || 'Something went wrong. Please try again.')
        }
        setIsScanning(false)
        return
      }

      if (!payload?.result) {
        setError('Something went wrong. Please try again.')
        setIsScanning(false)
        return
      }

      setResult(payload.result)
    } catch {
      setError('Could not reach the scanner. Check your connection and try again.')
    }

    setIsScanning(false)
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError(null)
    setIsRateLimited(false)
    setEmail('')
  }

  if (result) {
    const worstCategory = getWorstCategory(result.categories)
    const hasIssues = result.issues.length > 0
    const ctaCopy = hasIssues ? CTA_BY_CATEGORY[worstCategory] : null

    const scoreCategories = CATEGORY_ORDER.map((key) => ({
      label: CATEGORY_LABELS[key],
      value: result.categories[key].score,
      max: result.categories[key].max,
    }))

    return (
      <div className="space-y-10">
        <Card elevated radius="lg" className="p-8 sm:p-10">
          <ResumeScoreHero score={result.overall_score} scoreLabel={result.grade} categories={scoreCategories} />
        </Card>

        {hasIssues && (
          <Card radius="lg" className="p-6">
            <h2 className="text-(--foreground) font-bold mb-4">What to fix</h2>
            <ul className="space-y-4">
              {result.issues.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-(--accent) mt-0.5" />
                  <div>
                    <p className="text-(--foreground) font-semibold text-sm">{item.issue}</p>
                    <p className="text-(--muted) text-sm mt-0.5">{item.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card elevated radius="lg" className="p-6 text-center">
          {ctaCopy ? (
            <>
              <p className="text-(--foreground) font-semibold">{ctaCopy.headline}</p>
              <p className="text-(--muted) text-sm mt-1">Free plan includes 15 AI bullet rewrites and an ATS-optimized template every month.</p>
              <AuthAwareSignupLink className={`mt-4 inline-flex ${buttonVariants('primary', 'md')}`}>
                {ctaCopy.cta}
              </AuthAwareSignupLink>
            </>
          ) : (
            <>
              <p className="text-(--foreground) font-semibold">Strong score. This resume is in good shape.</p>
              <p className="text-(--muted) text-sm mt-1">Save it and start tailoring it for real job postings — free.</p>
              <AuthAwareSignupLink className={`mt-4 inline-flex ${buttonVariants('primary', 'md')}`}>
                Create your free account
              </AuthAwareSignupLink>
            </>
          )}
        </Card>

        <div className="text-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-(--muted) hover:text-(--foreground) transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Scan another resume
          </button>
        </div>
      </div>
    )
  }

  if (isRateLimited) {
    return (
      <Card radius="lg" className="p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-(--accent) mb-3" />
        <h2 className="text-(--foreground) font-bold text-lg">You&apos;ve used your 3 free scans today</h2>
        <p className="text-(--muted) text-sm mt-2 max-w-md mx-auto">
          Come back tomorrow for 3 more free scans, or create a free account for unlimited access to AI resume tools —
          scoring, tailoring, bullet rewrites, and cover letters.
        </p>
        <AuthAwareSignupLink className={`mt-5 inline-flex ${buttonVariants('primary', 'md')}`}>
          Create a free account
        </AuthAwareSignupLink>
      </Card>
    )
  }

  return (
    <Card radius="lg" className="p-8">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const selected = e.target.files?.[0]
          if (selected) handleFile(selected)
          e.currentTarget.value = ''
        }}
      />

      <div
        role="button"
        tabIndex={0}
        className={`rounded-xl border border-dashed p-10 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-(--accent) bg-(--accent-muted)' : 'border-(--border) hover:border-(--accent)/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const dropped = e.dataTransfer.files?.[0]
          if (dropped) handleFile(dropped)
        }}
      >
        {file ? (
          <>
            <FileText className="mx-auto h-7 w-7 text-(--accent) mb-3" />
            <p className="text-(--foreground) font-semibold">{file.name}</p>
            <p className="text-xs text-(--muted) mt-1">Ready to scan — click to choose a different file</p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-7 w-7 text-(--muted) mb-3" />
            <p className="text-(--foreground) font-semibold">Drag & drop your resume, or click to browse</p>
            <p className="text-xs text-(--muted) mt-1">.pdf or .docx — max 5 MB</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400 mt-4 text-center">{error}</p>}

      <div className="mt-6">
        <label htmlFor="ats-check-email" className="block text-sm text-(--foreground) font-medium mb-1.5">
          Get this report by email <span className="text-(--muted) font-normal">(optional)</span>
        </label>
        <input
          id="ats-check-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-lg border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--foreground) focus:border-(--accent) focus:outline-none"
        />
        <p className="text-xs text-(--muted) mt-1.5">Never required — you&apos;ll see your score either way.</p>
      </div>

      <button
        onClick={() => void handleScan()}
        disabled={!file || isScanning}
        className={`mt-6 w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants('primary', 'lg')}`}
      >
        {isScanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Scanning your resume...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" /> Scan My Resume — Free
          </>
        )}
      </button>

      <p className="text-xs text-(--muted) text-center mt-3">3 free scans a day · no signup · nothing saved</p>
    </Card>
  )
}
