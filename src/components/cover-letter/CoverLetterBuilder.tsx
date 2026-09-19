"use client"
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Save, Download, Play, Building2, Briefcase, Sparkles } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { SectionList } from '@/components/cover-letter/SectionList'
import { ParagraphModal } from '@/components/cover-letter/ParagraphModal'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { Modal } from '@/components/ui/Modal'
import { FeatureButton } from '@/components/FeatureButton'
import { buttonVariants } from '@/components/ui/Button'

type CoverLetterSections = {
  headerName: string
  headerEmail: string
  headerPhone: string
  date: string
  recipientName: string
  recipientTitle: string
  company: string
  position: string
  salutation: string
  introduction: string
  bodyParagraphs: string[]
  conclusion: string
  closingSignature: string
  tone: 'formal' | 'professional' | 'conversational'
}

type TextModalId =
  | 'header'
  | 'date'
  | 'recipient'
  | 'position'
  | 'salutation'
  | 'introduction'
  | 'conclusion'
  | 'closing'

const defaultSections: CoverLetterSections = {
  headerName: 'Your Name',
  headerEmail: 'you@example.com',
  headerPhone: '+1 (555) 000-0000',
  date: '',
  recipientName: '',
  recipientTitle: '',
  company: '',
  position: '',
  salutation: 'Dear Hiring Manager,',
  introduction:
    'I am writing to express my strong interest in this role. With my background in software development, I am confident I can contribute from day one.',
  bodyParagraphs: [
    'In recent roles, I delivered measurable impact, collaborated across teams, and maintained high standards for quality and execution.',
  ],
  conclusion:
    'I would welcome the opportunity to discuss how my experience aligns with your team needs.',
  closingSignature: 'Sincerely,\nYour Name',
  tone: 'professional',
}

function serializeSections(sections: CoverLetterSections) {
  return JSON.stringify({ version: 1, sections })
}

function parseSections(content: string): CoverLetterSections {
  try {
    const parsed = JSON.parse(content) as { sections?: Partial<CoverLetterSections> }
    if (parsed.sections) {
      return {
        ...defaultSections,
        ...parsed.sections,
        bodyParagraphs:
          parsed.sections.bodyParagraphs && parsed.sections.bodyParagraphs.length > 0
            ? parsed.sections.bodyParagraphs
            : defaultSections.bodyParagraphs,
      }
    }
  } catch {
    return {
      ...defaultSections,
      introduction: content || defaultSections.introduction,
    }
  }

  return defaultSections
}

function toResumeLikeText(sections: CoverLetterSections) {
  return [
    sections.headerName,
    sections.position,
    sections.introduction,
    ...sections.bodyParagraphs,
    sections.conclusion,
  ]
    .filter(Boolean)
    .join('\n')
}

export function CoverLetterBuilder() {
  const t = useTranslations('CoverLetterBuilder')
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const routeId = params?.id
  const isCreateMode = routeId === 'new' || !routeId

  const [sections, setSections] = useState<CoverLetterSections>(defaultSections)
  const [jobDescription, setJobDescription] = useState('')
  const [activeModal, setActiveModal] = useState<TextModalId | null>(null)
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [letterId, setLetterId] = useState<string | null>(null)
  const [modalDraft, setModalDraft] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState(t('upgradeDefaultMessage'))

  const computedTitle = useMemo(() => {
    if (sections.company && sections.position) return `${sections.company} - ${sections.position}`
    if (sections.company) return sections.company
    if (sections.position) return sections.position
    return t('untitledTitle')
  }, [sections.company, sections.position, t])

  const sectionItems = useMemo(() => {
    return [
      { id: 'header', label: t('sections.header'), completed: !!sections.headerName && !!sections.headerEmail },
      { id: 'date', label: t('sections.date'), completed: !!sections.date },
      { id: 'recipient', label: t('sections.recipient'), completed: !!sections.recipientName },
      { id: 'position', label: t('sections.position'), completed: !!sections.position && !!sections.company },
      { id: 'salutation', label: t('sections.salutation'), completed: !!sections.salutation },
      { id: 'introduction', label: t('sections.introduction'), completed: sections.introduction.trim().length > 0 },
      {
        id: 'body',
        label: t('sections.bodyParagraphs', { count: sections.bodyParagraphs.length }),
        completed: sections.bodyParagraphs.some((p) => p.trim().length > 0),
      },
      { id: 'conclusion', label: t('sections.conclusion'), completed: sections.conclusion.trim().length > 0 },
      { id: 'closing', label: t('sections.closing'), completed: sections.closingSignature.trim().length > 0 },
    ]
  }, [sections, t])

  const completedSections = useMemo(
    () => sectionItems.filter((item) => item.completed).length,
    [sectionItems]
  )

  useEffect(() => {
    let cancelled = false

    async function loadLetter() {
      if (isCreateMode) {
        setSections((prev) => ({
          ...prev,
          date: prev.date || new Date().toISOString().slice(0, 10),
        }))
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/cover-letters/${routeId}`, { cache: 'no-store' })
      if (!response.ok) {
        setIsLoading(false)
        return
      }

      const payload = (await response.json()) as {
        letter?: {
          id: string
          title: string
          content: string
        }
        data?: {
          letter?: {
            id: string
            title: string
            content: string
          }
        }
      }

      const letterPayload = payload.data?.letter || payload.letter

      if (cancelled || !letterPayload) {
        setIsLoading(false)
        return
      }

      setLetterId(letterPayload.id)
      setSections(parseSections(letterPayload.content || ''))

      const parts = (letterPayload.title || '').split(' - ')
      if (parts.length >= 2) {
        setSections((prev) => ({
          ...prev,
          company: prev.company || parts[0],
          position: prev.position || parts.slice(1).join(' - '),
        }))
      }

      setIsLoading(false)
    }

    loadLetter()

    return () => {
      cancelled = true
    }
  }, [isCreateMode, routeId])

  const persistLetter = useCallback(async () => {
    setSaveStatus('saving')

    const payload = {
      title: computedTitle,
      content: serializeSections(sections),
    }

    if (!letterId && isCreateMode) {
      const createRes = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!createRes.ok) {
        setSaveStatus('error')
        return
      }

      const responsePayload = (await createRes.json()) as { letter?: { id: string } }
      if (responsePayload.letter?.id) {
        setLetterId(responsePayload.letter.id)
        router.replace(`/cover-letters/${responsePayload.letter.id}`)
      }
      setSaveStatus('saved')
      return
    }

    const targetId = letterId || routeId
    if (!targetId || targetId === 'new') {
      setSaveStatus('error')
      return
    }

    const updateRes = await fetch(`/api/cover-letters/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaveStatus(updateRes.ok ? 'saved' : 'error')
  }, [computedTitle, isCreateMode, letterId, routeId, router, sections])

  useEffect(() => {
    if (isLoading) return
    const handle = setTimeout(() => {
      void persistLetter()
    }, 2000)
    return () => clearTimeout(handle)
  }, [isLoading, persistLetter])

  function openSectionEditor(id: string) {
    if (id === 'body') {
      setIsBodyModalOpen(true)
      return
    }

    const modal = id as TextModalId
    setActiveModal(modal)

    if (modal === 'header') {
      setModalDraft(`${sections.headerName}\n${sections.headerEmail}\n${sections.headerPhone}`)
      return
    }

    if (modal === 'date') {
      setModalDraft(sections.date)
      return
    }

    if (modal === 'recipient') {
      setModalDraft(`${sections.recipientName}\n${sections.recipientTitle}`)
      return
    }

    if (modal === 'position') {
      setModalDraft(`${sections.company}\n${sections.position}`)
      return
    }

    if (modal === 'salutation') {
      setModalDraft(sections.salutation)
      return
    }

    if (modal === 'introduction') {
      setModalDraft(sections.introduction)
      return
    }

    if (modal === 'conclusion') {
      setModalDraft(sections.conclusion)
      return
    }

    setModalDraft(sections.closingSignature)
  }

  function applyModalChanges() {
    if (!activeModal) return

    const lines = modalDraft.split('\n')
    if (activeModal === 'header') {
      setSections((prev) => ({
        ...prev,
        headerName: lines[0] || '',
        headerEmail: lines[1] || '',
        headerPhone: lines[2] || '',
      }))
    } else if (activeModal === 'date') {
      setSections((prev) => ({ ...prev, date: modalDraft }))
    } else if (activeModal === 'recipient') {
      setSections((prev) => ({
        ...prev,
        recipientName: lines[0] || '',
        recipientTitle: lines[1] || '',
      }))
    } else if (activeModal === 'position') {
      setSections((prev) => ({
        ...prev,
        company: lines[0] || '',
        position: lines[1] || '',
      }))
    } else if (activeModal === 'salutation') {
      setSections((prev) => ({ ...prev, salutation: modalDraft }))
    } else if (activeModal === 'introduction') {
      setSections((prev) => ({ ...prev, introduction: modalDraft }))
    } else if (activeModal === 'conclusion') {
      setSections((prev) => ({ ...prev, conclusion: modalDraft }))
    } else {
      setSections((prev) => ({ ...prev, closingSignature: modalDraft }))
    }

    setActiveModal(null)
    setModalDraft('')
  }

  async function generateDraft() {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: toResumeLikeText(sections),
          company: sections.company,
          position: sections.position,
          jobDescription,
          tone: sections.tone,
        }),
      })

      const payload = (await response.json()) as {
        result?: {
          salutation?: string
          paragraphs?: string[]
          closing?: string
        }
        showUpgrade?: boolean
        error?: string
      }

      if (!response.ok || !payload.result) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || t('errors.generateDraftAiUpgrade'))
          setShowUpgradeModal(true)
          setIsGenerating(false)
          return
        }
        alert(payload.error || t('errors.generateDraft'))
        setIsGenerating(false)
        return
      }

      const paragraphs = payload.result.paragraphs || []
      const intro = paragraphs[0] || sections.introduction
      const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : sections.conclusion
      const body = paragraphs.length > 2 ? paragraphs.slice(1, -1) : paragraphs.slice(1)

      setSections((prev) => ({
        ...prev,
        salutation: payload.result?.salutation || prev.salutation,
        introduction: intro,
        bodyParagraphs: body.length > 0 ? body : prev.bodyParagraphs,
        conclusion,
        closingSignature: payload.result?.closing || prev.closingSignature,
      }))
    } catch (error) {
      alert(t('errors.generateDraftFailed', { message: (error as Error).message }))
    }

    setIsGenerating(false)
  }

  async function exportAsPdf() {
    if (isExportingPdf) return
    setIsExportingPdf(true)

    try {
      const response = await fetch('/api/cover-letter/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: computedTitle,
          sections,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string }
        alert(payload.error || t('errors.exportPdf'))
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${computedTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'cover-letter'}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(t('errors.exportFailed', { message: (error as Error).message }))
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row">
      <div className="w-full lg:w-112.5 bg-(--surface) border-r border-(--border) flex flex-col h-full z-10 shadow-2xl">
        <div className="p-6 border-b border-(--border) bg-linear-to-r from-(--surface-elevated) to-(--surface)">
          <h2 className="text-xl font-bold text-(--foreground) flex items-center gap-2"><Sparkles className="text-(--accent) w-5 h-5"/> {t('heading')}</h2>
          <p className="text-sm text-(--muted) mt-2">{t('progress', { completed: completedSections, total: sectionItems.length })}</p>
          <div className="mt-3 h-2 w-full rounded-full bg-(--background)">
            <div className="h-2 rounded-full bg-(--accent)" style={{ width: `${(completedSections / sectionItems.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="grow p-6 overflow-y-auto">
          <SectionList sections={sectionItems} onSelect={openSectionEditor} />

          <div className="space-y-2 pt-5">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><Building2 className="w-4 h-4 text-(--muted)" /> {t('companyLabel')}</label>
            <input
              value={sections.company}
              onChange={(e) => setSections((prev) => ({ ...prev, company: e.target.value }))}
              type="text"
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong)"
              placeholder={t('companyPlaceholder')}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><Briefcase className="w-4 h-4 text-(--muted)" /> {t('positionLabel')}</label>
            <input
              value={sections.position}
              onChange={(e) => setSections((prev) => ({ ...prev, position: e.target.value }))}
              type="text"
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong)"
              placeholder={t('positionPlaceholder')}
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted) flex items-center gap-2"><FileText className="w-4 h-4 text-(--muted)" /> {t('jobDescriptionLabel')}</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) h-32 resize-none text-sm"
              placeholder={t('jobDescriptionPlaceholder')}
            ></textarea>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium text-(--muted)">{t('toneLabel')}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['formal', 'professional', 'conversational'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSections((prev) => ({ ...prev, tone }))}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    sections.tone === tone
                      ? 'border-(--accent)/50 bg-(--accent-muted) text-(--accent)'
                      : 'border-(--border) bg-(--surface) text-(--muted)'
                  }`}
                >
                  {t(`toneOptions.${tone}`)}
                </button>
              ))}
            </div>
          </div>

          <FeatureButton
            feature="covers"
            onClick={generateDraft}
            disabled={isGenerating}
            className={`mt-6 w-full shadow-lg shadow-(--accent)/20 ${buttonVariants('primary', 'md')}`}
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-(--background) border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> {t('generateDraftButton')}
              </>
            )}
          </FeatureButton>
        </div>

        <div className="p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4">
          <button
            onClick={() => void persistLetter()}
            disabled={isLoading || saveStatus === 'saving' || isExportingPdf}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {t('saveButton')}
          </button>
          <button
            onClick={() => void exportAsPdf()}
            disabled={isLoading || isExportingPdf}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> {t('exportPdfButton')}
          </button>
        </div>
      </div>

      <div className="grow bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative">
        <div className="w-full max-w-200 h-full bg-white rounded-lg shadow-2xl mx-auto overflow-hidden">
          <div className="h-full overflow-y-auto p-12 text-black font-serif text-[15px] leading-relaxed">
            <div className="mb-8 text-sm text-gray-700">
              <p className="font-semibold">{sections.headerName}</p>
              <p>{sections.headerEmail}</p>
              <p>{sections.headerPhone}</p>
              <p className="mt-4">{sections.date || new Date().toLocaleDateString()}</p>
            </div>

            <div className="mb-6 text-sm text-gray-700">
              {sections.recipientName ? <p>{sections.recipientName}</p> : null}
              {sections.recipientTitle ? <p>{sections.recipientTitle}</p> : null}
              {sections.company ? <p>{sections.company}</p> : null}
            </div>

            <p className="mb-4 whitespace-pre-wrap">{sections.salutation}</p>
            <p className="mb-4 whitespace-pre-wrap">{sections.introduction}</p>
            {sections.bodyParagraphs.map((paragraph, index) => (
              <p key={index} className="mb-4 whitespace-pre-wrap">{paragraph}</p>
            ))}
            <p className="mb-4 whitespace-pre-wrap">{sections.conclusion}</p>
            <p className="whitespace-pre-wrap">{sections.closingSignature}</p>
          </div>
        </div>

        <div className="absolute top-3 right-4 text-xs text-(--muted) bg-black/40 px-2 py-1 rounded">
          {saveStatus === 'saving' ? t('saveStatus.saving') : saveStatus === 'saved' ? t('saveStatus.saved') : saveStatus === 'error' ? t('saveStatus.error') : t('saveStatus.idle')}
        </div>
      </div>

      <ParagraphModal
        open={isBodyModalOpen}
        paragraphs={sections.bodyParagraphs}
        onClose={() => setIsBodyModalOpen(false)}
        onChange={(next) => setSections((prev) => ({ ...prev, bodyParagraphs: next }))}
      />

      <Modal
        open={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={t('editSectionModal.title')}
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setActiveModal(null)} className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)">
              {t('cancelButton')}
            </button>
            <button onClick={applyModalChanges} className={buttonVariants('primary', 'md')}>
              {t('saveChangesButton')}
            </button>
          </div>
        }
      >
        <textarea
          value={modalDraft}
          onChange={(e) => setModalDraft(e.target.value)}
          className="h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
        />
        <p className="mt-2 text-xs text-(--muted)">
          {t('editSectionModal.helperText')}
        </p>
      </Modal>

      <UpgradeBanner
        open={showUpgradeModal}
        message={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}
