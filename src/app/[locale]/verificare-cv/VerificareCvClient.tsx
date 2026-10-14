"use client"

import { useState, useRef } from 'react'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  RotateCcw,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Users,
  Copy,
  Check,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'
import type { FastAtsAnalysisResult } from '@/lib/ats-fast-parser'
import { startCheckout } from '@/lib/client-billing'
import type { AppLocale } from '@/i18n/routing'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTS = ['.pdf', '.docx']

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx >= 0 ? filename.slice(idx).toLowerCase() : ''
}

export function VerificareCvClient() {
  const locale = useLocale() as AppLocale
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FastAtsAnalysisResult | null>(null)
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleFileSelect(selected: File) {
    setError(null)
    const ext = getExtension(selected.name)
    if (!ALLOWED_EXTS.includes(ext)) {
      setError('Format neacceptat. Te rugăm să încarci un fișier PDF sau DOCX.')
      setFile(null)
      return
    }
    if (selected.size > MAX_BYTES) {
      setError('Fișierul depășește limita maximă de 5 MB.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  async function handleScan() {
    if (!file) return
    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/public/ats-fast-check', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data.result) {
        setError(data.error || 'A apărut o problemă la scanarea fișierului. Asigură-te că PDF-ul conține text lizibil.')
        setIsScanning(false)
        return
      }

      setResult(data.result)
    } catch {
      setError('Eroare de conexiune. Verifică conexiunea la internet și încearcă din nou.')
    } finally {
      setIsScanning(false)
    }
  }

  function handleReset() {
    setFile(null)
    setResult(null)
    setError(null)
    setShowPaywallModal(false)
  }

  async function handleStart14DayPass() {
    setCheckoutLoading(true)
    try {
      await startCheckout('pro', locale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la pornirea procesării plății.')
      setCheckoutLoading(false)
    }
  }

  function copyReferralLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://joben.eu'
    const refLink = `${origin}/?ref=FREEPRO`
    navigator.clipboard.writeText(refLink)
    setReferralCopied(true)
    setTimeout(() => setReferralCopied(false), 3000)
  }

  const scoreColor =
    (result?.overallScore ?? 0) >= 75
      ? 'text-emerald-500 border-emerald-500'
      : (result?.overallScore ?? 0) >= 50
      ? 'text-amber-500 border-amber-500'
      : 'text-rose-500 border-rose-500'

  return (
    <div className="space-y-10">
      {!result ? (
        <Card elevated radius="lg" className="p-8 sm:p-12 text-center">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-14 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-(--foreground) bg-(--accent-muted)/30 scale-[1.01]'
                : file
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-(--border) hover:border-(--foreground) bg-(--surface)'
            }`}
          >
            <div className="mx-auto flex flex-col items-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-(--accent-muted) flex items-center justify-center mb-5 text-(--foreground)">
                {file ? <FileText className="h-8 w-8 text-emerald-500" /> : <Upload className="h-8 w-8" />}
              </div>

              {file ? (
                <div>
                  <p className="font-semibold text-lg text-(--foreground)">{file.name}</p>
                  <p className="text-sm text-(--muted) mt-1">{(file.size / 1024).toFixed(1)} KB &bull; Gata de analiză</p>
                  <p className="text-xs text-(--foreground) font-mono underline mt-2">Schimbă fișierul</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-lg text-(--foreground)">
                    Trage și plasează CV-ul aici sau <span className="underline decoration-2">alege din calculator</span>
                  </p>
                  <p className="text-sm text-(--muted) mt-2">Suportă PDF și DOCX (max 5 MB). 100% Confidențial.</p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2 justify-center">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleScan}
              disabled={!file || isScanning}
              className={`px-8 py-3.5 text-base font-semibold shadow-md ${buttonVariants('primary', 'lg')} disabled:opacity-50`}
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Se parsează și se analizează ATS...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Verifică Scorul ATS Gratuit
                </span>
              )}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-(--muted) pt-6 border-t border-(--border)">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Fără cont necesar</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Analiză instantă &lt; 1 secundă</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Nu stocăm documentul tău</span>
            </div>
          </div>
        </Card>
      ) : (
        /* --- TEASER REPORT --- */
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          <Card elevated radius="lg" className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-(--border)">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div
                  className={`h-28 w-28 rounded-full border-4 flex flex-col items-center justify-center font-bold ${scoreColor}`}
                >
                  <span className="text-4xl tabular-nums">{result.overallScore}</span>
                  <span className="text-[10px] tracking-wider uppercase text-(--muted)">din 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-xs uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-(--accent-muted) text-(--foreground)">
                      Calificativ: {result.grade}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-(--foreground) mt-1">
                    {result.overallScore >= 75
                      ? 'CV-ul tău are șanse mari să treacă de ATS!'
                      : result.overallScore >= 50
                      ? 'CV-ul tău riscă să fie filtrat automat de ATS'
                      : 'CV-ul tău va fi cel mai probabil respins de softurile ATS'}
                  </h2>
                  <p className="text-sm text-(--muted) mt-1 max-w-lg">
                    Am detectat {result.wordCount} cuvinte, {result.detectedSections.length} secțiuni standard și{' '}
                    {result.metricsFoundCount} rezultate măsurabile.
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-(--muted) hover:text-(--foreground) underline font-mono"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Scanează alt CV
              </button>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {Object.entries(result.categories).map(([key, cat]) => {
                const pct = Math.round((cat.score / cat.max) * 100)
                return (
                  <div key={key} className="p-4 rounded-xl bg-(--surface) border border-(--border)">
                    <div className="flex justify-between items-center text-xs text-(--muted) mb-1.5">
                      <span>{cat.label}</span>
                      <span className="font-mono font-bold text-(--foreground)">
                        {cat.score}/{cat.max}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-(--border) rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Top 3 Visible Critical Errors */}
          <Card radius="lg" className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="h-6 w-6 text-rose-500" />
              <div>
                <h3 className="text-xl font-bold text-(--foreground)">3 Erori Majore Detectate în CV</h3>
                <p className="text-xs text-(--muted)">Corectarea acestora îți poate crește rata de răspuns cu peste 40%.</p>
              </div>
            </div>

            <div className="space-y-5">
              {result.visibleIssues.map((issue, idx) => (
                <div key={issue.id} className="p-5 rounded-xl border border-(--border) bg-(--surface) space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm text-(--foreground)">{issue.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold shrink-0">
                      {issue.severity === 'critical' ? 'Critic' : 'Avertisment'}
                    </span>
                  </div>
                  <p className="text-xs text-(--muted) pl-7">{issue.explanation}</p>
                  <div className="pl-7 pt-1 flex items-start gap-1.5 text-xs text-(--foreground) font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Cum repari: {issue.howToFix}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Locked / Paywalled Teaser Issues */}
          <Card radius="lg" className="p-8 relative overflow-hidden border-2 border-dashed border-(--foreground)/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-(--foreground) font-bold text-lg">
                <Lock className="h-5 w-5 text-amber-500" />
                <span>Încă 7 Deficiențe Critice Ascunse</span>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold">
                Raport Complet Blocat
              </span>
            </div>

            {/* Blurred Items List */}
            <div className="space-y-3 filter blur-[4px] select-none pointer-events-none opacity-60">
              {result.lockedIssuesPreview.map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-(--surface) border border-(--border) flex justify-between">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="text-xs text-(--muted)">{item.category}</span>
                </div>
              ))}
            </div>

            {/* Overlay Banner */}
            <div className="absolute inset-0 bg-(--background)/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md space-y-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Lock className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-(--foreground)">
                  Deblochează Raportul Complet &amp; Ghidul de Optimizare
                </h4>
                <p className="text-xs text-(--muted)">
                  Află exact ce cuvinte cheie lipsesc din CV-ul tău pentru poziția dorită și cum să le integrezi fără să fii respins de filtrul automat.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => setShowPaywallModal(true)}
                    className={`px-6 py-3 font-semibold text-sm ${buttonVariants('primary', 'md')}`}
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Deblochează Raportul &amp; Auto-Fix
                  </button>
                  <Link
                    href={`/${locale}/sign-up`}
                    className={`px-6 py-3 text-sm font-semibold ${buttonVariants('secondary', 'md')}`}
                  >
                    Creează Cont Gratuit
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* --- PAYWALL / CONVERSION MODAL --- */}
      <Modal
        open={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        title="Deblochează Raportul ATS Complet & Rescrie cu AI"
        maxWidth="xl"
      >
        <div className="space-y-6 py-2">
          <div className="text-center space-y-1">
            <p className="text-sm text-(--muted)">
              Alege cum vrei să deblochezi raportul complet cu toate cele 10 erori și optimizarea automată a CV-ului:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: 14-Day Interview Pass (39 RON) */}
            <div className="p-5 rounded-xl border-2 border-(--foreground) bg-(--accent-muted)/20 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-4 bg-(--foreground) text-(--background) text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Cel Mai Popular
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-(--foreground)" />
                  <h4 className="font-bold text-base text-(--foreground)">Pass Interviu (14 Zile)</h4>
                </div>
                <div className="font-mono">
                  <span className="text-3xl font-extrabold text-(--foreground)">39 RON</span>
                  <span className="text-xs text-(--muted)"> / plată unică</span>
                </div>
                <p className="text-xs text-(--muted)">Fără abonament recurent. Acces complet timp de 2 săptămâni.</p>

                <ul className="space-y-1.5 text-xs text-(--foreground) pt-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Raport ATS detaliat pe toate cele 10 criterii</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Rescriere automată AI a punctelor slabe</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Generare nelimitată de scrisori de intenție</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Descărcări PDF nelimitate optimizate ATS</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStart14DayPass}
                disabled={checkoutLoading}
                className={`mt-6 w-full ${buttonVariants('primary', 'md')} text-sm font-semibold`}
              >
                {checkoutLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Se redirecționează spre Stripe...
                  </span>
                ) : (
                  <span>Activează Pass-ul (39 RON)</span>
                )}
              </button>
            </div>

            {/* Option 2: Referral / Invite a Friend */}
            <div className="p-5 rounded-xl border border-(--border) bg-(--surface) flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  <h4 className="font-bold text-base text-(--foreground)">Recomandă unui Prieten</h4>
                </div>
                <div className="font-mono">
                  <span className="text-3xl font-extrabold text-emerald-500">GRATUIT</span>
                  <span className="text-xs text-(--muted)"> / 7 zile Pro</span>
                </div>
                <p className="text-xs text-(--muted)">
                  Nu vrei să plătești? Invită un coleg sau prieten care își caută job.
                </p>

                <ul className="space-y-1.5 text-xs text-(--foreground) pt-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Primești 7 zile acces Pro gratuit</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Prietenul tău primește 3 zile Pro cadou</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Fără card bancar necesar</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  onClick={copyReferralLink}
                  className={`w-full ${buttonVariants('secondary', 'md')} text-sm font-semibold flex items-center justify-center gap-2`}
                >
                  {referralCopied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      <span>Link Copiat în Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiază Link-ul de Recomandare</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-(--muted)">
                  Trimite link-ul pe WhatsApp sau LinkedIn prietenilor tăi.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-(--border)">
            <Link
              href={`/${locale}/sign-up`}
              className="text-xs text-(--muted) hover:text-(--foreground) underline font-mono"
            >
              Sau creează un cont gratuit de bază &rarr;
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
