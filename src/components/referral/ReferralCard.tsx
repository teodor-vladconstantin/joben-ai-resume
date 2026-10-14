"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  Copy,
  Check,
  Gift,
  Share2,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'

interface ReferralInfo {
  referralCode: string
  referralCount: number
  referralCredits: number
  referralLink: string
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referral')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) {
          setData(json)
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  function handleCopy() {
    if (!data?.referralLink) return
    navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareText = encodeURIComponent(
    'Am găsit Joben.eu – un editor excelent de CV-uri cu AI care îți verifică și optimizează CV-ul pentru filtrele ATS. Dacă te înscrii prin link-ul meu primești 3 zile de acces Pro gratuit:'
  )
  const encodedUrl = encodeURIComponent(data?.referralLink || 'https://joben.eu/?ref=PRO')

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  if (loading) {
    return (
      <Card radius="lg" className="p-6 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-(--muted)" />
      </Card>
    )
  }

  const fallbackLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=FREEPRO` : 'https://joben.eu/?ref=FREEPRO'
  const activeLink = data?.referralLink || fallbackLink
  const count = data?.referralCount ?? 0
  const daysWon = count * 7

  return (
    <Card elevated radius="lg" className="p-6 sm:p-8 space-y-6 border border-emerald-500/30 bg-emerald-500/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-(--foreground)">Recomandă Joben și Primești Zile Pro Gratuit</h3>
            <p className="text-xs text-(--muted)">
              Pentru fiecare prieten care își creează cont, tu primești <strong className="text-(--foreground)">7 zile Pro</strong>, iar el primește <strong className="text-(--foreground)">3 zile Pro cadou</strong>!
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-(--surface) border border-(--border) text-right shrink-0">
          <p className="text-[10px] text-(--muted) uppercase font-mono">Prieteni Invitați</p>
          <p className="text-sm font-bold text-emerald-500 font-mono">
            {count} ({daysWon} zile câștigate)
          </p>
        </div>
      </div>

      {/* Copy link box */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-(--foreground)">Link-ul tău unic de recomandare:</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={activeLink}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-(--border) bg-(--surface) text-(--foreground) focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className={`shrink-0 ${buttonVariants('primary', 'sm')} text-xs font-semibold flex items-center gap-1.5`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copiat!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copiază</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Share Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-(--border)">
        <span className="text-xs text-(--muted) mr-1">Distribuie rapid pe:</span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>WhatsApp</span>
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>LinkedIn</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  )
}
