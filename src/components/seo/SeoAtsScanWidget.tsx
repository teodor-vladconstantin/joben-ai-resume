"use client"

import { useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, Loader2, RotateCcw, Sparkles, Upload } from 'lucide-react'
import { AppLink } from '@/components/ui/AppLink'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import type { FastAtsAnalysisResult } from '@/lib/ats-fast-parser'
import type { AppLocale } from '@/i18n/routing'

interface SeoAtsScanWidgetProps {
  // Any slug from src/data/seo-jobs.ts; the server matches the CV text
  // against that role's keywords.
  jobSlug: string
  jobTitle: string
}

interface KeywordMatch {
  matchPercentage: number
  foundKeywords: string[]
  missingKeywords: string[]
}

const ERROR_CODES = new Set([
  'rate_limited',
  'invalid_input',
  'file_too_large',
  'unsupported_type',
  'unreadable',
  'too_little_text',
  'server',
])

export function SeoAtsScanWidget({ jobSlug, jobTitle }: SeoAtsScanWidgetProps) {
  const t = useTranslations('FastAts')
  const locale = useLocale() as AppLocale
  const [file, setFile] = useState<File | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ fastAts: FastAtsAnalysisResult; keywordMatch: KeywordMatch | null } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFileSelect(selected: File) {
    setError(null)
    const ext = selected.name.toLowerCase().slice(selected.name.lastIndexOf('.'))
    if (ext !== '.pdf' && ext !== '.docx') {
      setError(t('errors.unsupported_type'))
      return
    }
    setFile(selected)
  }

  async function handleScan() {
    if (!file) return
    setIsScanning(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobSlug', jobSlug)
      formData.append('locale', locale)
      const distinctId = posthog.get_distinct_id?.()
      if (distinctId) {
        formData.append('distinctId', distinctId)
        const sessionId = posthog.get_session_id?.()
        if (sessionId) formData.append('sessionId', sessionId)
      }
      const response = await fetch('/api/public/ats-fast-check', { method: 'POST', body: formData })
      const data = (await response.json().catch(() => ({}))) as {
        result?: FastAtsAnalysisResult
        keywordMatch?: KeywordMatch | null
        error?: string
      }
      if (!response.ok || !data.result) {
        setError(t(`errors.${data.error && ERROR_CODES.has(data.error) ? data.error : 'server'}`))
        return
      }
      setResult({ fastAts: data.result, keywordMatch: data.keywordMatch ?? null })
    } catch {
      setError(t('errors.network'))
    } finally {
      setIsScanning(false)
    }
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError(null)
  }

  const match = result?.keywordMatch
  const matchLabel = !match
    ? null
    : match.matchPercentage >= 70
    ? t('widget.matchHigh')
    : match.matchPercentage >= 40
    ? t('widget.matchMid')
    : t('widget.matchLow')

  return (
    <Card elevated radius="lg" className="p-6 sm:p-8 border-2 border-foreground/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-foreground mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t('widget.badge', { job: jobTitle })}
          </div>
          <h3 className="text-xl font-bold text-foreground">{t('widget.title', { job: jobTitle })}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t('widget.subtitle')}</p>
        </div>
        {result && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('widget.rescan')}
          </button>
        )}
      </div>

      {!result ? (
        <div className="pt-6 space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
            }}
          />
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-foreground bg-card'
            }`}
          >
            <div className="flex flex-col items-center">
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('upload.change')}</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-foreground">{t('widget.uploadPrompt', { job: jobTitle })}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('upload.formats')}</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={!file || isScanning}
            className={`w-full py-3 ${buttonVariants('primary', 'md')} text-sm font-semibold disabled:opacity-50`}
          >
            <span className="flex items-center gap-2 justify-center">
              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isScanning ? t('widget.scanning', { job: jobTitle }) : t('widget.button')}
            </span>
          </button>
        </div>
      ) : (
        <div className="pt-6 space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {match && (
              <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border-4 border-foreground flex items-center justify-center font-bold text-foreground">
                  <span className="text-xl tabular-nums">{match.matchPercentage}%</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('widget.match')}</p>
                  <p className="text-sm font-bold text-foreground">{matchLabel}</p>
                  <p className="text-xs text-muted-foreground">{t('widget.forJob', { job: jobTitle })}</p>
                </div>
              </div>
            )}
            <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-foreground flex items-center justify-center font-bold text-foreground">
                <span className="text-xl tabular-nums">{result.fastAts.overallScore}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('widget.atsScore')}</p>
                <p className="text-sm font-bold text-foreground">
                  {t('result.grade', { grade: t(`grades.${result.fastAts.grade}`) })}
                </p>
              </div>
            </div>
          </div>

          {match && match.missingKeywords.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                <span>{t('widget.missing')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {match.missingKeywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {match && match.foundKeywords.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">{t('widget.found')}</p>
              <div className="flex flex-wrap gap-1.5">
                {match.foundKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded text-xs bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.fastAts.issues.length > 0 && (
            <ul className="space-y-1 text-xs text-foreground">
              {result.fastAts.issues.slice(0, 3).map((issue) => (
                <li key={issue.id} className="flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{t(`issues.${issue.id}.title`, issue.params)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-2">
            <AppLink
              href="/sign-up"
              className={`w-full py-3 ${buttonVariants('primary', 'md')} text-sm font-semibold flex items-center justify-center gap-2`}
            >
              <span>{t('widget.cta')}</span>
              <ArrowRight className="h-4 w-4" />
            </AppLink>
            <p className="text-[11px] text-center text-muted-foreground mt-2">{t('widget.ctaNote')}</p>
          </div>
        </div>
      )}
    </Card>
  )
}
