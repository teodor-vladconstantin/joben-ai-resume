"use client"

import { useRef, useState } from 'react'
import { Upload, Loader2, AlertTriangle, CheckCircle2, RotateCcw, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { ResumeScoreHero } from '@/components/landing/ResumeScoreHero'
import { PlanCta } from '@/components/pricing/PlanCta'

type AtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'
type GradeKey = 'Poor' | 'Fair' | 'Good' | 'Excellent'

type AtsCategory = { score: number; max: number }

type AtsIssue = { issue: string; explanation: string }

type AtsResult = {
  overall_score: number
  grade: GradeKey
  categories: Record<AtsCategoryKey, AtsCategory>
  issues: AtsIssue[]
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx']
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const CATEGORY_ORDER: AtsCategoryKey[] = ['ats_formatting', 'structure', 'keyword_impact', 'clarity']
const CATEGORY_TO_MESSAGE_KEY: Record<AtsCategoryKey, 'formatting' | 'structure' | 'keywords' | 'clarity'> = {
  ats_formatting: 'formatting',
  structure: 'structure',
  keyword_impact: 'keywords',
  clarity: 'clarity',
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
  const t = useTranslations('AtsChecker')
  const tGrade = useTranslations('Grade')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [email, setEmail] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [result, setResult] = useState<AtsResult | null>(null)
  const [scanId, setScanId] = useState<string | null>(null)
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null)
  const [postScanEmail, setPostScanEmail] = useState('')
  const [isSendingReport, setIsSendingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const categoryLabels = {
    ats_formatting: t('categoryLabels.formatting'),
    structure: t('categoryLabels.structure'),
    keyword_impact: t('categoryLabels.keywords'),
    clarity: t('categoryLabels.clarity'),
  } as const

  function handleFile(selected: File) {
    setError(null)
    setIsRateLimited(false)

    const extension = getExtension(selected.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError(t('errors.fileType'))
      setFile(null)
      return
    }

    if (selected.size > MAX_UPLOAD_BYTES) {
      setError(t('errors.fileSize'))
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
        | { result?: AtsResult; scanId?: string | null; emailSent?: boolean; error?: string }
        | null

      if (!response.ok) {
        if (response.status === 429) {
          setIsRateLimited(true)
        } else {
          setError(payload?.error || t('errors.generic'))
        }
        setIsScanning(false)
        return
      }

      if (!payload?.result) {
        setError(t('errors.generic'))
        setIsScanning(false)
        return
      }

      setResult(payload.result)
      setScanId(payload.scanId ?? null)
      setEmailSentTo(payload.emailSent ? email.trim() : null)
    } catch {
      setError(t('errors.networkScan'))
    }

    setIsScanning(false)
  }

  async function handleSendReport() {
    if (!scanId || !postScanEmail.trim()) return

    setIsSendingReport(true)
    setReportError(null)

    try {
      const response = await fetch('/api/public/ats-check/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, email: postScanEmail.trim() }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; email?: string; error?: string }
        | null

      if (!response.ok || !payload?.success) {
        setReportError(payload?.error || t('errors.emailGeneric'))
        setIsSendingReport(false)
        return
      }

      setEmailSentTo(payload.email || postScanEmail.trim())
    } catch {
      setReportError(t('errors.emailNetwork'))
    }

    setIsSendingReport(false)
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError(null)
    setIsRateLimited(false)
    setEmail('')
    setScanId(null)
    setEmailSentTo(null)
    setPostScanEmail('')
    setReportError(null)
  }

  if (result) {
    const worstCategory = getWorstCategory(result.categories)
    const hasIssues = result.issues.length > 0
    const worstCategoryMessageKey = hasIssues ? CATEGORY_TO_MESSAGE_KEY[worstCategory] : null

    const scoreCategories = CATEGORY_ORDER.map((key) => ({
      label: categoryLabels[key],
      value: result.categories[key].score,
      max: result.categories[key].max,
    }))

    return (
      <div className="space-y-10">
        <Card elevated radius="lg" className="p-8 sm:p-10">
          <ResumeScoreHero
            score={result.overall_score}
            gradeLabel={tGrade(`labels.${result.grade}`)}
            gradeDescription={tGrade(`descriptions.${result.grade}`)}
            categories={scoreCategories}
          />
        </Card>

        <Card radius="lg" className="p-6 text-center">
          <p className="text-(--foreground) font-semibold">{t('wantRewriting')}</p>
          <p className="mt-2">
            <span className="text-2xl text-(--foreground) font-bold">{t('proPrice')}</span>
            <span className="text-(--muted)"> {t('proPricePeriod')}</span>
          </p>
          <PlanCta plan="pro" label={t('ctaByCategory.keywords.cta')} className={`mt-4 inline-flex ${buttonVariants('primary', 'md')}`} />
        </Card>

        {hasIssues && (
          <Card radius="lg" className="p-6">
            <h2 className="text-(--foreground) font-bold mb-4">{t('whatToFix')}</h2>
            <ul className="space-y-4">
              {result.issues.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-(--foreground) mt-0.5" />
                  <div>
                    <p className="text-(--foreground) font-semibold text-sm">{item.issue}</p>
                    <p className="text-(--muted) text-sm mt-0.5">{item.explanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {scanId && (
          emailSentTo ? (
            <Card radius="lg" className="p-6 text-center">
              <p className="text-(--foreground) font-semibold text-sm">{t('reportSentTo', { email: emailSentTo })}</p>
              <button
                onClick={() => setEmailSentTo(null)}
                className="mt-2 text-xs text-(--muted) hover:text-(--foreground) underline"
              >
                {t('sendDifferentEmail')}
              </button>
            </Card>
          ) : (
            <Card radius="lg" className="p-6">
              <h2 className="text-(--foreground) font-bold mb-1">{t('getReportByEmail')}</h2>
              <p className="text-(--muted) text-sm mb-4">{t('emailExplainer')}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={postScanEmail}
                  onChange={(e) => setPostScanEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="flex-1 rounded-sm border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
                />
                <button
                  onClick={() => void handleSendReport()}
                  disabled={!postScanEmail.trim() || isSendingReport}
                  className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants('secondary', 'md')}`}
                >
                  {isSendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : t('emailMeThisReport')}
                </button>
              </div>
              {reportError && <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2 mt-2">{reportError}</p>}
            </Card>
          )
        )}

        <Card elevated radius="lg" className="p-6 text-center">
          {worstCategoryMessageKey ? (
            <>
              <p className="text-(--foreground) font-semibold">{t(`ctaByCategory.${worstCategoryMessageKey}.headline`)}</p>
              <p className="text-(--muted) text-sm mt-1">{t('freeIncludes')}</p>
              <AuthAwareSignupLink className={`mt-4 inline-flex ${buttonVariants('primary', 'md')}`}>
                {t(`ctaByCategory.${worstCategoryMessageKey}.cta`)}
              </AuthAwareSignupLink>
            </>
          ) : (
            <>
              <p className="text-(--foreground) font-semibold">{t('strongScore')}</p>
              <p className="text-(--muted) text-sm mt-1">{t('strongScoreSubtext')}</p>
              <AuthAwareSignupLink className={`mt-4 inline-flex ${buttonVariants('primary', 'md')}`}>
                {t('createFreeAccount')}
              </AuthAwareSignupLink>
            </>
          )}
        </Card>

        <div className="text-center">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 text-sm text-(--muted) hover:text-(--foreground) transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {t('scanAnother')}
          </button>
        </div>
      </div>
    )
  }

  if (isRateLimited) {
    return (
      <Card radius="lg" className="p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-(--foreground) mb-3" />
        <h2 className="text-(--foreground) font-bold text-lg">{t('usedFreeScan')}</h2>
        <p className="text-(--muted) text-sm mt-2 max-w-md mx-auto">
          {t('usedFreeScanBody1')} {t('usedFreeScanBody2')}
        </p>
        <AuthAwareSignupLink className={`mt-5 inline-flex ${buttonVariants('primary', 'md')}`}>
          {t('createFreeAccountShort')}
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
        className={`border border-dashed p-10 text-center transition-colors duration-150 ease-out cursor-pointer ${
          isDragging ? 'border-(--accent) bg-(--accent-muted)' : 'border-(--border) hover:border-(--accent)'
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
            <FileText className="mx-auto h-7 w-7 text-(--foreground) mb-3" />
            <p className="text-(--foreground) font-semibold">{file.name}</p>
            <p className="text-xs text-(--muted) mt-1">{t('readyToScan')}</p>
          </>
        ) : (
          <>
            <Upload className="mx-auto h-7 w-7 text-(--muted) mb-3" />
            <p className="text-(--foreground) font-semibold">{t('dragAndDrop')}</p>
            <p className="text-xs text-(--muted) mt-1">{t('fileHint')}</p>
          </>
        )}
      </div>

      {error && <p className="text-sm font-medium text-(--foreground) mt-4 text-center">{error}</p>}

      <div className="mt-6">
        <label htmlFor="ats-check-email" className="block text-sm text-(--foreground) font-medium mb-1.5">
          {t('getReportByEmail')} <span className="text-(--muted) font-normal">{t('optional')}</span>
        </label>
        <input
          id="ats-check-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="w-full rounded-sm border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none"
        />
        <p className="text-xs text-(--muted) mt-1.5">{t('neverRequired')}</p>
      </div>

      <button
        onClick={() => void handleScan()}
        disabled={!file || isScanning}
        className={`mt-6 w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants('primary', 'lg')}`}
      >
        {isScanning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> {t('scanning')}
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5" /> {t('scanButton')}
          </>
        )}
      </button>

      <p className="text-xs text-(--muted) text-center mt-3">{t('scanDisclaimer')}</p>
    </Card>
  )
}
