'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowRight, Upload } from 'lucide-react'
import posthog from 'posthog-js'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { atsCheckerPath } from '@/lib/ats-checker-path'
import { isAppPath } from '@/lib/app-origin'
import { setPendingScanFile } from '@/lib/pending-scan-file'

export type AtsCtaLocation = 'hero' | 'card_templates' | 'sticky' | 'dupa_download' | 'guide_keywords'
type Variant = 'card' | 'hero-upload' | 'sticky-mobile'

const GREEN_BUTTON =
  'cta-pulse inline-flex items-center justify-center gap-2 rounded-md bg-[#2CB87A] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#35c98a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2CB87A]'

function useCtaHref(location: AtsCtaLocation) {
  const locale = useLocale()
  const page = usePathname()
  const href = `${atsCheckerPath(locale)}?from=${location}`
  const track = () => posthog.capture('cta_ats_clicked', { location, locale, page })
  return { href, track }
}

function ScoreRing({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const el = ref.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (!el || reduced || typeof IntersectionObserver === 'undefined') {
      frame = requestAnimationFrame(() => setScore(41))
      return () => cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1100, 1)
        setScore(Math.round(41 * (1 - Math.pow(1 - p, 3))))
        if (p < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div ref={ref} className="flex shrink-0 flex-col items-center gap-1">
      <div className="relative size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-border" />
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" strokeLinecap="round" stroke="#f59e0b" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">{score}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function HeroUpload({ location }: { location: AtsCtaLocation }) {
  const t = useTranslations('AtsScanCta')
  const router = useRouter()
  const { href, track } = useCtaHref(location)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function go(file?: File) {
    track()
    if (file) setPendingScanFile(file)
    router.push(href)
  }

  return (
    <div className="mt-8 flex max-w-xl items-center gap-5 rounded-xl border border-border bg-card p-4 shadow-card">
      <ScoreRing label={t('exampleScore')} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          go(e.dataTransfer.files?.[0])
        }}
        className={`flex min-w-0 grow cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-4 text-center transition-colors ${dragging ? 'border-[#2CB87A] bg-[#2CB87A]/10' : 'border-border hover:border-[#2CB87A]'}`}
      >
        <Upload className="size-5 text-[#2CB87A]" aria-hidden />
        <p className="text-sm font-semibold">{t('headline')}</p>
        <p className="text-xs text-muted-foreground">{t('sub')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('dropHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => go(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}

function Card({ location }: { location: AtsCtaLocation }) {
  const t = useTranslations('AtsScanCta')
  const { href, track } = useCtaHref(location)
  const afterDownload = location === 'dupa_download'
  return (
    <div className="flex w-full flex-col items-start justify-between gap-4 rounded-xl bg-gradient-to-br from-[#0f3d2b] to-[#16643f] p-5 text-white sm:flex-row sm:items-center">
      <div>
        <p className="text-lg font-bold">{afterDownload ? t('afterTitle') : t('headline')}</p>
        <p className="mt-1 text-sm text-white/80">{afterDownload ? t('afterText') : t('sub')}</p>
      </div>
      <Link href={href} onClick={track} className={`shrink-0 ${GREEN_BUTTON}`}>
        {t('button')} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  )
}

function StickyMobile() {
  const t = useTranslations('AtsScanCta')
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const { href, track } = useCtaHref('sticky')
  const onChecker = pathname === '/free-ats-checker' || pathname === '/verificare-cv-ats'
  if (onChecker || isAppPath(pathname) || isSignedIn) return null
  return (
    <>
      {/* In-flow spacer so the fixed bar never covers the footer. */}
      <div className="h-16 shrink-0 md:hidden" aria-hidden />
      <div className="ats-sticky fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
        <p className="min-w-0 text-sm font-semibold leading-tight">{t('headline')}</p>
        <Link href={href} onClick={track} className={`shrink-0 ${GREEN_BUTTON}`}>
          {t('button')}
        </Link>
      </div>
    </>
  )
}

export function AtsScanCta({ variant, location }: { variant: Variant; location: AtsCtaLocation }) {
  if (variant === 'sticky-mobile') return <StickyMobile />
  if (variant === 'hero-upload') return <HeroUpload location={location} />
  return <Card location={location} />
}
