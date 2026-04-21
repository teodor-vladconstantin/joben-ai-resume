"use client"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, User, Briefcase, GraduationCap, Code, Cpu, Save, Download, Trash2, FileText, Sparkles } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { TemplateSwitcher } from '@/components/builder/TemplateSwitcher'
import { HarvardTemplate } from '@/components/templates/HarvardTemplate'
import { AddContentModal, type AddableSection } from '@/components/builder/AddContentModal'
import { SectionPanel } from '@/components/builder/SectionPanel'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { FeatureButton } from '@/components/FeatureButton'
import { startProCheckout } from '@/lib/client-billing'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'
import { BeforeAfterModal, type FixPatchWithContext } from '@/components/ui/BeforeAfterModal'
import { AILoadingState } from '@/components/ui/AILoadingState'

type ResumeTemplate = 'harvard'

function normalizeTemplate(): ResumeTemplate {
  // Migrate all historical template ids to Harvard.
  return 'harvard'
}

type DynamicSection = {
  id: string
  type: AddableSection['type']
  title: string
  content: string
}

type ExperienceEntry = {
  id: string
  title: string
  company: string
  period: string
  description: string
  bullets?: string[]
}

type ResumeData = {
  template: ResumeTemplate
  personal: {
    firstName: string
    lastName: string
    title: string
    email: string
    phone: string
    summary: string
  }
  experience: ExperienceEntry[]
  dynamicSections: DynamicSection[]
}

type SummaryGenerationMode = 'resume' | 'scratch'

type BulletDraftState = {
  draft: string
  isLoading: boolean
  error: string | null
}

function normalizeExperienceBullets(
  input: unknown,
  fallbackDescription?: string,
  options?: { keepEmpty?: boolean }
): string[] {
  if (Array.isArray(input) && input.length > 0) {
    const rawBullets = input.map((item) => (typeof item === 'string' ? item : ''))

    if (options?.keepEmpty) {
      return rawBullets
    }

    const normalizedBullets = rawBullets.map((item) => item.trim()).filter(Boolean)
    if (normalizedBullets.length > 0) return normalizedBullets
  }

  if (typeof fallbackDescription === 'string' && fallbackDescription.trim()) {
    return [fallbackDescription.trim()]
  }

  return ['']
}

function normalizeExperienceEntry(entry: Partial<ExperienceEntry>): ExperienceEntry {
  const bullets = normalizeExperienceBullets(entry.bullets, entry.description, { keepEmpty: true })
  const description =
    bullets.find((bullet) => bullet.trim().length > 0) ||
    (typeof entry.description === 'string' ? entry.description.trim() : '')

  return {
    id: entry.id || `exp_${Date.now()}`,
    title: entry.title || '',
    company: entry.company || '',
    period: entry.period || '',
    description,
    bullets,
  }
}

function getExperienceBullets(entry: ExperienceEntry): string[] {
  return normalizeExperienceBullets(entry.bullets, entry.description, { keepEmpty: true })
}

function getBulletFieldKey(experienceId: string, bulletIndex: number): string {
  return `${experienceId}:${bulletIndex}`
}

const initialResumeData: ResumeData = {
  template: 'harvard',
  personal: { firstName: '', lastName: '', title: '', email: '', phone: '', summary: '' },
  experience: [],
  dynamicSections: [],
}

const tabSectionMap: Record<string, AddableSection['type'][]> = {
  education: ['education'],
  skills: ['skills'],
  projects: ['projects'],
  certifications: ['certifications'],
  sections: ['professional_summary', 'career_objective', 'leadership', 'research', 'awards', 'publications'],
}


export function ResumeBuilder() {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const bulletFieldRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})
  const [activeTab, setActiveTab] = useState('experience')
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [isPending] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false)
  const [tailorJobDescription, setTailorJobDescription] = useState('')
  const [isTailoring, setIsTailoring] = useState(false)
  const [bulletDraftStates, setBulletDraftStates] = useState<Record<string, BulletDraftState>>({})
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Upgrade to Pro to unlock this AI feature.')
  const [highlightedBulletIndex, setHighlightedBulletIndex] = useState<number | null>(null)
  const [fixBanner, setFixBanner] = useState<string | null>(null)
  const [fixPatches, setFixPatches] = useState<FixPatchWithContext[]>([])
  const [showBeforeAfterModal, setShowBeforeAfterModal] = useState(false)
  const [isSummaryGeneratorOpen, setIsSummaryGeneratorOpen] = useState(false)
  const [summaryGenerationMode, setSummaryGenerationMode] = useState<SummaryGenerationMode>('resume')
  const [summaryRoleDescription, setSummaryRoleDescription] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummaryDraft, setGeneratedSummaryDraft] = useState('')
  const [summaryGenerationError, setSummaryGenerationError] = useState<string | null>(null)
  const [pendingBulletScrollKey, setPendingBulletScrollKey] = useState<string | null>(null)
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const routeResumeId = params?.id
  const isCreateMode = routeResumeId === 'new' || !routeResumeId

  const derivedTitle = useMemo(() => {
    return `${resumeData.personal.firstName} ${resumeData.personal.lastName}`.trim() || 'Untitled Resume'
  }, [resumeData.personal.firstName, resumeData.personal.lastName])
  
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'projects', label: 'Projects', icon: Cpu },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'sections', label: 'More Sections', icon: FileText },
  ]

  useEffect(() => {
    let cancelled = false

    async function loadResume() {
      if (isCreateMode) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/resumes/${routeResumeId}`, { cache: 'no-store' })
      if (!response.ok) {
        setIsLoading(false)
        return
      }

      const payload = (await response.json()) as {
        resume?: {
          id: string
          data?: ResumeData
        }
      }

      if (cancelled) return

      if (payload.resume) {
        setResumeId(payload.resume.id)
        const loadedData = payload.resume.data
        if (loadedData) {
          setResumeData((prev) => {
            const incomingExperience = Array.isArray(loadedData.experience)
              ? loadedData.experience.map((exp) => normalizeExperienceEntry(exp as Partial<ExperienceEntry>))
              : prev.experience

            return {
              template: normalizeTemplate() || prev.template,
              personal: { ...prev.personal, ...(loadedData.personal || {}) },
              experience: incomingExperience,
              dynamicSections: loadedData.dynamicSections || prev.dynamicSections,
            }
          })
        }
      }

      setIsLoading(false)
    }

    loadResume()

    return () => {
      cancelled = true
    }
  }, [isCreateMode, routeResumeId])

  useEffect(() => {
    if (isLoading) return

    const source = searchParams?.get('source')
    if (source !== 'ai-review') return

    // Read Before/After patches from sessionStorage and show modal
    const SESSION_KEY = 'ai-fix-patches'
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const patches = JSON.parse(stored) as FixPatchWithContext[]
        if (Array.isArray(patches) && patches.length > 0) {
          setFixPatches(patches)
          setShowBeforeAfterModal(true)
        }
        sessionStorage.removeItem(SESSION_KEY)
      }
    } catch {
      // sessionStorage unavailable
    }

    // Banner for auto-fix or single fix
    const fixesApplied = searchParams?.get('fixesApplied')
    const fixApplied = searchParams?.get('fixApplied')
    if (fixesApplied !== null) {
      const count = parseInt(fixesApplied, 10)
      setFixBanner(
        count > 0
          ? `AI applied ${count} improvement${count === 1 ? '' : 's'} to your resume.`
          : 'Auto-fix complete - no changes needed.'
      )
    } else if (fixApplied === 'true') {
      setFixBanner('Fix applied successfully.')
    }

    // Switch to correct tab
    const section = searchParams?.get('section')
    const validTabs = ['personal', 'experience', 'education', 'skills', 'projects', 'certifications', 'sections']
    if (section && validTabs.includes(section)) {
      setActiveTab(section)
    }

    // Precise highlight via experienceId + bulletIndex
    const experienceId = searchParams?.get('experienceId')
    const bulletIndexParam = searchParams?.get('bulletIndex')
    if (experienceId && bulletIndexParam !== null) {
      const bulletIndex = parseInt(bulletIndexParam, 10)
      const expIdx = resumeData.experience.findIndex((e) => e.id === experienceId)
      if (expIdx >= 0 && !isNaN(bulletIndex) && bulletIndex >= 0) {
        const globalOffset = resumeData.experience
          .slice(0, expIdx)
          .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)
        const globalIdx = globalOffset + bulletIndex
        setHighlightedBulletIndex(globalIdx)

        setTimeout(() => {
          const el = document.querySelector<HTMLElement>(`[data-bullet-global-index="${globalIdx}"]`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.focus()
          }
        }, 150)

        const clearTimer = setTimeout(() => setHighlightedBulletIndex(null), 3500)
        return () => clearTimeout(clearTimer)
      }
    }
  }, [isLoading, searchParams, resumeData.experience])

  useEffect(() => {
    if (!pendingBulletScrollKey) return

    const frameId = requestAnimationFrame(() => {
      const targetField = bulletFieldRefs.current[pendingBulletScrollKey]
      if (targetField) {
        targetField.scrollIntoView({ behavior: 'smooth', block: 'center' })
        targetField.focus()
      }
      setPendingBulletScrollKey(null)
    })

    return () => cancelAnimationFrame(frameId)
  }, [pendingBulletScrollKey])

  const persistResume = useCallback(async () => {
    setSaveStatus('saving')

    const payload = {
      title: derivedTitle,
      data: resumeData,
    }

    if (!resumeId && isCreateMode) {
      const createRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!createRes.ok) {
        try {
          const errorPayload = (await createRes.json()) as {
            error?: string
            showUpgrade?: boolean
          }

          if (errorPayload.showUpgrade) {
            setUpgradeMessage(errorPayload.error || 'This action requires Pro access.')
            setShowUpgradeModal(true)
          }
        } catch {
          // Keep existing behavior when response body is unavailable.
        }

        setSaveStatus('error')
        return
      }

      const created = (await createRes.json()) as { resume?: { id: string } }
      if (created.resume?.id) {
        setResumeId(created.resume.id)
        router.replace(`/resumes/${created.resume.id}`)
      }

      setSaveStatus('saved')
      return
    }

    const targetId = resumeId || routeResumeId
    if (!targetId || targetId === 'new') {
      setSaveStatus('error')
      return
    }

    const updateRes = await fetch(`/api/resumes/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaveStatus(updateRes.ok ? 'saved' : 'error')
  }, [derivedTitle, isCreateMode, resumeData, resumeId, routeResumeId, router])

  useEffect(() => {
    if (isLoading || isImportingPdf || isExportingPdf) return
    const handle = setTimeout(() => {
      void persistResume()
    }, 800)

    return () => clearTimeout(handle)
  }, [isExportingPdf, isImportingPdf, isLoading, persistResume])

  const updatePersonalField = (field: keyof typeof initialResumeData.personal, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value,
      },
    }))
  }

  const handleOnboardingImport = (data: ResumeTemplateData) => {
    setResumeData((prev) => ({
      ...prev,
      personal: data.personal,
      experience: (data.experience ?? []).map((exp, i) => ({
        id: exp.id || `exp_${Date.now()}_${i}`,
        title: exp.title || '',
        company: exp.company || '',
        period: exp.period || '',
        description: exp.description || '',
        bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
          ? exp.bullets
          : exp.description ? [exp.description] : [''],
      })),
      dynamicSections: (data.dynamicSections ?? []).map((s, i) => ({
        id: s.id || `section_${i}`,
        type: s.type as DynamicSection['type'],
        title: s.title || '',
        content: s.content || '',
      })),
    }))
  }

  const exportAsLatexPdf = async () => {
    if (isExportingPdf) return

    setIsExportingPdf(true)

    try {
      setSaveStatus('saving')
      const payload = {
        title: derivedTitle,
        data: resumeData,
      }
      const res = await fetch('/api/resumes/export-latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = (await res.json()) as {
          error?: string
          showUpgrade?: boolean
        }

        if (err.showUpgrade) {
          setUpgradeMessage(err.error || 'This export action requires Pro access.')
          setShowUpgradeModal(true)
          setSaveStatus('error')
          return
        }

        alert(err.error || 'Failed to export LaTeX PDF')
        setSaveStatus('error')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${derivedTitle || 'resume'}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSaveStatus('saved')
    } catch {
      alert('Network error while exporting PDF')
      setSaveStatus('error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const updateExperienceMetaField = (
    experienceId: string,
    field: 'title' | 'company' | 'period',
    value: string
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === experienceId
          ? {
              ...exp,
              [field]: value,
            }
          : exp
      ),
    }))
  }

  const updateExperienceBulletField = (experienceId: string, bulletIndex: number, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== experienceId) return exp

        const nextBullets = [...getExperienceBullets(exp)]
        nextBullets[bulletIndex] = value
        const summaryBullet = nextBullets.find((bullet) => bullet.trim().length > 0) || nextBullets[0] || ''

        return {
          ...exp,
          bullets: nextBullets,
          description: summaryBullet,
        }
      }),
    }))
  }

  const clearBulletDraftsForExperience = useCallback((experienceId: string) => {
    setBulletDraftStates((prev) => {
      const keys = Object.keys(prev)
      let hasMatch = false

      for (const key of keys) {
        if (key.startsWith(`${experienceId}:`)) {
          hasMatch = true
          break
        }
      }

      if (!hasMatch) {
        return prev
      }

      const next: Record<string, BulletDraftState> = {}
      for (const key of keys) {
        if (!key.startsWith(`${experienceId}:`)) {
          next[key] = prev[key]
        }
      }
      return next
    })
  }, [])

  const addExperienceBullet = (experienceId: string) => {
    let nextKey: string | null = null

    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === experienceId
          ? (() => {
              const nextBullets = [...getExperienceBullets(exp), '']
              nextKey = getBulletFieldKey(exp.id, nextBullets.length - 1)

              return {
                ...exp,
                bullets: nextBullets,
              }
            })()
          : exp
      ),
    }))

    clearBulletDraftsForExperience(experienceId)

    if (nextKey) {
      setPendingBulletScrollKey(nextKey)
    }
  }

  const removeExperienceBullet = (experienceId: string, bulletIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== experienceId) return exp

        const currentBullets = getExperienceBullets(exp)
        const nextBullets = currentBullets.filter((_, index) => index !== bulletIndex)
        const safeBullets = nextBullets.length > 0 ? nextBullets : ['']
        const summaryBullet = safeBullets.find((bullet) => bullet.trim().length > 0) || safeBullets[0] || ''

        return {
          ...exp,
          bullets: safeBullets,
          description: summaryBullet,
        }
      }),
    }))

    clearBulletDraftsForExperience(experienceId)
  }

  const handleDeleteExperience = (experienceId: string) => {
    if (confirm('Are you sure you want to delete this experience entry?')) {
      setResumeData(prevData => ({
        ...prevData,
        experience: prevData.experience.filter(exp => exp.id !== experienceId),
      }))
      clearBulletDraftsForExperience(experienceId)
    }
  }

  const handleAddRole = () => {
    const newRole = {
      id: `exp_${Date.now()}`,
      title: 'New Role',
      company: 'Company Name',
      period: 'Start - End',
      description: 'Describe your impact and achievements.',
      bullets: ['Describe your impact and achievements.'],
    }

    setResumeData((prevData) => ({
      ...prevData,
      experience: [newRole, ...prevData.experience],
    }))
  }

  const visibleDynamicSections = useMemo(() => {
    const allowedTypes = tabSectionMap[activeTab] || []
    return resumeData.dynamicSections.filter((section) => allowedTypes.includes(section.type))
  }, [activeTab, resumeData.dynamicSections])

  const handleAddSection = (section: AddableSection) => {
    const newSection: DynamicSection = {
      id: `sec_${Date.now()}`,
      type: section.type,
      title: section.title,
      content: '',
    }

    setResumeData((prev) => ({
      ...prev,
      dynamicSections: [...prev.dynamicSections, newSection],
    }))

    const tabForType = Object.entries(tabSectionMap).find(([, types]) => types.includes(section.type))?.[0]
    if (tabForType) setActiveTab(tabForType)
    setIsAddModalOpen(false)
  }

  const updateDynamicSection = (id: string, patch: Partial<DynamicSection>) => {
    setResumeData((prev) => ({
      ...prev,
      dynamicSections: prev.dynamicSections.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      ),
    }))
  }

  const deleteDynamicSection = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      dynamicSections: prev.dynamicSections.filter((section) => section.id !== id),
    }))
  }

  const handleImportPdf = async (file: File) => {
    if (isImportingPdf) return

    setIsImportingPdf(true)

    try {
      const data = await importPdfClientSide(file)
      handleOnboardingImport(data)
      setActiveTab('personal')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF import failed. Please try again.')
    } finally {
      setIsImportingPdf(false)
    }
  }

  const handleTailorResume = async () => {
    if (!tailorJobDescription.trim()) {
      alert('Add a job description before tailoring.')
      return
    }

    setIsTailoring(true)

    try {
      const response = await fetch('/api/tailor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobDescription: tailorJobDescription,
          optimizationType: 'job_specific',
        }),
      })

      const payload = (await response.json()) as {
        result?: {
          updatedBullets?: string[]
          summary?: string
        }
        showUpgrade?: boolean
        error?: string
      }

      if (!response.ok || !payload.result) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'Tailor is available on Pro.')
          setShowUpgradeModal(true)
          setIsTailoring(false)
          return
        }
        alert(payload.error || 'Could not tailor resume.')
        setIsTailoring(false)
        return
      }

      const bullets = payload.result.updatedBullets || []

      setResumeData((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          summary: payload.result?.summary || prev.personal.summary,
        },
        experience: prev.experience.map((exp, index) => {
          const optimized = bullets[index]
          if (!optimized) return exp

          const nextBullets = [...getExperienceBullets(exp)]
          nextBullets[0] = optimized

          return {
            ...exp,
            bullets: nextBullets,
            description: optimized,
          }
        }),
      }))

      setIsTailorModalOpen(false)
    } catch (error) {
      alert(`Tailor failed: ${(error as Error).message}`)
    }

    setIsTailoring(false)
  }

  const handleGenerateBulletDraft = async (experienceId: string, bulletIndex = 0) => {
    const target = resumeData.experience.find((item) => item.id === experienceId)
    if (!target) return

    const targetBullets = getExperienceBullets(target)
    const targetBullet = targetBullets[bulletIndex] || ''
    const draftKey = getBulletFieldKey(experienceId, bulletIndex)

    if (!targetBullet.trim()) {
      setBulletDraftStates((prev) => ({
        ...prev,
        [draftKey]: {
          draft: prev[draftKey]?.draft || '',
          isLoading: false,
          error: 'Add bullet text before generating an AI draft.',
        },
      }))
      return
    }

    setBulletDraftStates((prev) => ({
      ...prev,
      [draftKey]: {
        draft: prev[draftKey]?.draft || '',
        isLoading: true,
        error: null,
      },
    }))

    try {
      const response = await fetch('/api/improve-bullet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bullet: targetBullet,
          context: `${target.title} at ${target.company} (${target.period})`,
        }),
      })

      const payload = (await response.json()) as {
        bullet?: string
        showUpgrade?: boolean
        error?: string
        currentPlan?: 'free' | 'pro' | 'recruiting'
        limit?: number
        remaining?: number
        resetAt?: number
      }

      if (!response.ok || !payload.bullet) {
        let errorMessage = payload.error || 'Could not generate bullet draft.'

        if (response.status === 429) {
          const details: string[] = [payload.error || 'Daily limit reached. Try again later.']

          if (typeof payload.remaining === 'number' && typeof payload.limit === 'number') {
            details.push(`Remaining in current window: ${payload.remaining}/${payload.limit}`)
          }

          if (typeof payload.resetAt === 'number') {
            details.push(`Resets at: ${new Date(payload.resetAt).toLocaleString()}`)
          }

          errorMessage = details.join('\n')

          if (payload.showUpgrade && payload.currentPlan !== 'pro') {
            setUpgradeMessage(errorMessage)
            setShowUpgradeModal(true)
          }
        } else if (payload.showUpgrade) {
          errorMessage = payload.error || 'Bullet rewrite is available on Pro.'
          setUpgradeMessage(errorMessage)
          setShowUpgradeModal(true)
        }

        setBulletDraftStates((prev) => ({
          ...prev,
          [draftKey]: {
            draft: prev[draftKey]?.draft || '',
            isLoading: false,
            error: errorMessage,
          },
        }))
        return
      }

      setBulletDraftStates((prev) => ({
        ...prev,
        [draftKey]: {
          draft: payload.bullet?.trim() || '',
          isLoading: false,
          error: null,
        },
      }))
    } catch (error) {
      setBulletDraftStates((prev) => ({
        ...prev,
        [draftKey]: {
          draft: prev[draftKey]?.draft || '',
          isLoading: false,
          error: `Draft generation failed: ${(error as Error).message}`,
        },
      }))
    }
  }

  const handleAcceptBulletDraft = (experienceId: string, bulletIndex: number) => {
    const draftKey = getBulletFieldKey(experienceId, bulletIndex)
    const draft = bulletDraftStates[draftKey]?.draft?.trim()
    if (!draft) return

    updateExperienceBulletField(experienceId, bulletIndex, draft)

    setBulletDraftStates((prev) => {
      const next = { ...prev }
      delete next[draftKey]
      return next
    })
  }

  const handleGenerateSummary = async (mode: SummaryGenerationMode) => {
    setSummaryGenerationMode(mode)
    setSummaryGenerationError(null)

    if (mode === 'scratch' && !summaryRoleDescription.trim()) {
      setSummaryGenerationError('Please describe the target role before generating from scratch.')
      return
    }

    setIsGeneratingSummary(true)
    setGeneratedSummaryDraft('')

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          roleDescription: mode === 'scratch' ? summaryRoleDescription : undefined,
          resumeData: mode === 'resume' ? resumeData : undefined,
        }),
      })

      const payload = (await response.json()) as {
        summary?: string
        error?: string
      }

      if (!response.ok || !payload.summary) {
        setSummaryGenerationError(payload.error || 'Could not generate summary. Please retry.')
        setIsGeneratingSummary(false)
        return
      }

      setGeneratedSummaryDraft(payload.summary)
    } catch (error) {
      setSummaryGenerationError(`Summary generation failed: ${(error as Error).message}`)
    }

    setIsGeneratingSummary(false)
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:min-w-315 lg:flex-row print:block" suppressHydrationWarning>
      {/* Editor Sidebar */}
      <div
        className="w-full min-h-0 bg-[#0A0F0D] border-r border-white/10 flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden z-10 shadow-2xl lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden"
        suppressHydrationWarning
      >
        <input
          ref={importInputRef}
          id="pdf-import-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              void handleImportPdf(file)
              e.currentTarget.value = ''
            }
          }}
        />
        <div
          className="shrink-0 border-b border-white/10 px-4 pt-5 pb-4 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden custom-scrollbar tabs-scrollbar scroll-smooth"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-35 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id 
                ? 'bg-[#0A9548]/10 text-[#0A9548] border border-[#0A9548]/30' 
                : 'text-[#FFFFFF]/82 hover:bg-[#0A0F0D] hover:text-white border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 p-4 pt-5 border-b border-white/10 space-y-3">
          <TemplateSwitcher
            value={resumeData.template}
            onChange={(value) =>
              setResumeData((prev) => ({
                ...prev,
                template: value,
              }))
            }
          />
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/10 px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A9548]/20"
            >
              + Add Section
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImportingPdf}
              className="flex-1 rounded-lg border border-white/10 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-white/88 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPdf ? 'Importing PDF...' : 'Import from PDF'}
            </button>
            <FeatureButton
              feature="jds"
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-lg border border-white/12 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A0F0D]"
            >
              AI Tailor
            </FeatureButton>
          </div>
        </div>
        
        {fixBanner ? (
          <div className="shrink-0 mx-4 mt-3 rounded-xl border border-[#0A9548]/40 bg-[#0A9548]/10 px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-[#16DB65] font-medium">{fixBanner}</p>
            <button
              onClick={() => setFixBanner(null)}
              className="text-[#FFFFFF]/60 hover:text-white text-xs shrink-0"
            >
              x
            </button>
          </div>
        ) : null}

        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar builder-panel-scrollbar"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {activeTab === 'personal' && (
            <div className="space-y-4" suppressHydrationWarning>
              <h2 className="text-xl font-bold text-white mb-6">Personal details</h2>
              {/* Form fields would be controlled components, omitted for brevity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">First Name</label>
                  <input type="text" value={resumeData.personal.firstName} onChange={(e) => updatePersonalField('firstName', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Last Name</label>
                  <input type="text" value={resumeData.personal.lastName} onChange={(e) => updatePersonalField('lastName', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#FFFFFF]/82">Job Title</label>
                <input type="text" value={resumeData.personal.title} onChange={(e) => updatePersonalField('title', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Email</label>
                  <input type="email" value={resumeData.personal.email} onChange={(e) => updatePersonalField('email', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Phone</label>
                  <input type="text" value={resumeData.personal.phone} onChange={(e) => updatePersonalField('phone', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-[#FFFFFF]/82">Professional Summary</label>
                  <button
                    onClick={() => setIsSummaryGeneratorOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#0A9548]/40 bg-[#0A9548]/10 px-2.5 py-1 text-xs font-semibold text-[#16DB65] hover:bg-[#0A9548]/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate with AI
                  </button>
                </div>

                <textarea
                  value={resumeData.personal.summary}
                  onChange={(e) => updatePersonalField('summary', e.target.value)}
                  className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors h-28 resize-none"
                  placeholder="Professional summary"
                />

                {isSummaryGeneratorOpen ? (
                  <div className="rounded-xl border border-white/10 bg-[#020202] p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSummaryGenerationMode('resume')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'resume'
                            ? 'border border-[#0A9548]/40 bg-[#0A9548]/15 text-[#16DB65]'
                            : 'border border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/78 hover:text-white'
                        }`}
                      >
                        Based on my resume
                      </button>
                      <button
                        onClick={() => setSummaryGenerationMode('scratch')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'scratch'
                            ? 'border border-[#0A9548]/40 bg-[#0A9548]/15 text-[#16DB65]'
                            : 'border border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/78 hover:text-white'
                        }`}
                      >
                        Write from scratch
                      </button>
                    </div>

                    {summaryGenerationMode === 'scratch' ? (
                      <textarea
                        value={summaryRoleDescription}
                        onChange={(e) => setSummaryRoleDescription(e.target.value)}
                        className="h-24 w-full resize-none rounded-lg border border-white/10 bg-[#0A0F0D] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                        placeholder="Describe your target role, level, and focus areas..."
                      />
                    ) : null}

                    {isGeneratingSummary ? (
                      <div className="rounded-lg border border-white/10 bg-[#0A0F0D]">
                        <AILoadingState stage="generating" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsSummaryGeneratorOpen(false)}
                          className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                          className="rounded-md bg-linear-to-r from-[#0A9548] to-[#04471C] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                        >
                          Generate summary
                        </button>
                      </div>
                    )}

                    {summaryGenerationError ? (
                      <p className="text-xs text-[#16DB65]">{summaryGenerationError}</p>
                    ) : null}

                    <AnimatePresence>
                      {generatedSummaryDraft ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/8 p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#16DB65]">AI Draft</p>
                          <p className="text-sm text-white/95 leading-relaxed">{generatedSummaryDraft}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                              className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => updatePersonalField('summary', generatedSummaryDraft)}
                              className="rounded-md bg-[#16DB65] px-3 py-1.5 text-xs font-semibold text-[#052A14] hover:bg-[#2AEA7A]"
                            >
                              Accept summary
                            </button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          
          {activeTab === 'experience' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Work Experience</h2>
                <button onClick={handleAddRole} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Role</button>
              </div>
              
              {resumeData.experience.map((exp, expIndex) => {
                const experienceBullets = getExperienceBullets(exp)
                const globalBulletOffset = resumeData.experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)

                return (
                 <div key={exp.id} className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4 hover:border-[#16DB65]/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/82">Experience Entry</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button 
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-[#16DB65] hover:text-[#2AEA7A] p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-[#16DB65] border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input
                       value={exp.title}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'title', e.target.value)}
                       className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                       placeholder="Role title"
                     />
                     <div className="grid grid-cols-2 gap-2">
                       <input
                         value={exp.company}
                         onChange={(e) => updateExperienceMetaField(exp.id, 'company', e.target.value)}
                         className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                         placeholder="Company"
                       />
                       <input
                         value={exp.period}
                         onChange={(e) => updateExperienceMetaField(exp.id, 'period', e.target.value)}
                         className="w-full rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                         placeholder="Period"
                       />
                     </div>

                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/72">Impact Bullets</p>
                         <button
                           onClick={() => addExperienceBullet(exp.id)}
                           className="text-xs font-medium text-[#0A9548] hover:text-[#16DB65]"
                         >
                           + Add Bullet
                         </button>
                       </div>

                       {experienceBullets.map((bullet, bulletIndex) => {
                         const globalIdx = globalBulletOffset + bulletIndex
                         const isHighlighted = highlightedBulletIndex === globalIdx
                         const draftKey = getBulletFieldKey(exp.id, bulletIndex)
                         const draftState = bulletDraftStates[draftKey]
                         const hasDraft = Boolean(draftState?.draft?.trim())
                         return (
                         <div key={`${exp.id}-bullet-${bulletIndex}`} className="space-y-2">
                           <motion.div
                             initial={{ opacity: 0, y: 8 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ duration: 0.2, ease: 'easeOut' }}
                             className="flex items-start gap-2"
                           >
                             <span className="pt-2 text-[#0A9548]">•</span>
                             <textarea
                               ref={(node) => {
                                 bulletFieldRefs.current[draftKey] = node
                               }}
                               data-bullet-global-index={globalIdx}
                               value={bullet}
                               onChange={(e) => updateExperienceBulletField(exp.id, bulletIndex, e.target.value)}
                               className={`h-20 w-full resize-none rounded-lg border bg-[#020202] px-3 py-2 text-sm text-white focus:outline-none transition-colors ${
                                 isHighlighted
                                   ? 'border-[#16DB65] ring-2 ring-[#16DB65]/40 focus:border-[#16DB65]'
                                   : 'border-white/10 focus:border-[#16DB65]'
                               }`}
                               placeholder="Describe measurable impact"
                             />
                             <div className="flex flex-col gap-1">
                               <button
                                 onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                 disabled={Boolean(draftState?.isLoading)}
                                 className="rounded-md border border-[#0A9548]/40 px-2 py-1 text-[11px] text-[#0A9548] hover:bg-[#0A9548]/10 disabled:cursor-not-allowed disabled:opacity-70"
                               >
                                 {draftState?.isLoading ? 'AI...' : 'AI Draft'}
                               </button>
                               <button
                                 onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                 disabled={experienceBullets.length === 1}
                                 className="rounded-md border border-[#16DB65]/35 px-2 py-1 text-[11px] text-[#16DB65] hover:bg-[#0A9548]/12 disabled:cursor-not-allowed disabled:opacity-40"
                               >
                                 Del
                               </button>
                             </div>
                           </motion.div>

                           <p className="pl-5 text-[11px] text-[#7CFFB2]/90">
                             AI Draft and Regenerate each consume 1 bullet rewrite credit.
                           </p>

                           {draftState?.isLoading ? (
                             <div className="ml-5 rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-xs text-[#FFFFFF]/82">
                               Generating AI draft...
                             </div>
                           ) : null}

                           {draftState?.error ? (
                             <p className="ml-5 text-xs text-[#16DB65] whitespace-pre-line">{draftState.error}</p>
                           ) : null}

                           <AnimatePresence>
                             {hasDraft ? (
                               <motion.div
                                 initial={{ opacity: 0, y: 8 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 8 }}
                                 transition={{ duration: 0.2, ease: 'easeOut' }}
                                 className="ml-5 rounded-lg border border-[#0A9548]/30 bg-[#0A9548]/8 p-3 space-y-2"
                               >
                                 <div className="flex items-center justify-between gap-2">
                                   <p className="text-[11px] font-semibold uppercase tracking-wide text-[#16DB65]">AI Draft</p>
                                   <p className="text-[11px] text-[#7CFFB2]/90">Regenerate uses 1 credit</p>
                                 </div>
                                 <p className="text-sm text-white/95 leading-relaxed">{draftState?.draft}</p>
                                 <div className="flex items-center justify-end gap-2 pt-1">
                                   <button
                                     onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-md border border-white/10 bg-[#0A0F0D] px-3 py-1.5 text-xs font-medium text-[#FFFFFF]/78 hover:text-white"
                                   >
                                     Regenerate
                                   </button>
                                   <button
                                     onClick={() => handleAcceptBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-md bg-[#16DB65] px-3 py-1.5 text-xs font-semibold text-[#052A14] hover:bg-[#2AEA7A]"
                                   >
                                     Accept
                                   </button>
                                 </div>
                               </motion.div>
                             ) : null}
                           </AnimatePresence>
                         </div>
                       )
                       })}
                     </div>
                   </div>
                </div>
                )
              })}
            </div>
          )}

          {['education', 'skills', 'projects', 'certifications', 'sections'].includes(activeTab) ? (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Section</button>
              </div>

              {visibleDynamicSections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-[#FFFFFF]/82">
                  No sections yet for this category. Use Add Section to create one.
                </div>
              ) : (
                visibleDynamicSections.map((section) => (
                  <SectionPanel
                    key={section.id}
                    title={section.title}
                    content={section.content}
                    onTitleChange={(value) => updateDynamicSection(section.id, { title: value })}
                    onContentChange={(value) => updateDynamicSection(section.id, { content: value })}
                    onDelete={() => deleteDynamicSection(section.id)}
                  />
                ))
              )}
            </div>
          ) : null}
        </div>
        
        <div className="shrink-0 p-4 border-t border-white/10 bg-[#020202] flex justify-between items-center gap-4" suppressHydrationWarning>
          <button onClick={() => void persistResume()} className="flex-1 bg-[#0A0F0D] border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={exportAsLatexPdf}
            disabled={isExportingPdf || isImportingPdf}
            className="flex-1 bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-4 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#0A9548]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="w-4 h-4" /> {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Live Preview Pane */}
      <div className="grow min-w-0 bg-[#020202] h-full flex flex-col p-4 lg:p-8 overflow-hidden relative print:p-0 print:block print:bg-white print:h-auto" suppressHydrationWarning>
        {/* Mock A4 Paper Preview */}
        <div className="h-full w-full max-w-230 bg-white rounded-lg shadow-2xl mx-auto overflow-y-auto print:shadow-none print:w-full print:max-w-none print:overflow-visible print:h-auto">
          <HarvardTemplate data={resumeData} />
        </div>
        <div className="absolute top-3 right-4 text-xs text-[#FFFFFF]/82 bg-black/40 px-2 py-1 rounded print:hidden">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : 'Idle'}
        </div>
      </div>

      <AddContentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSection}
      />

      {isTailorModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setIsTailorModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0A0F0D] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">AI Resume Tailor</h3>
            <p className="mt-1 text-sm text-[#FFFFFF]/82">Paste a job description and tailor your resume bullets for this role.</p>

            <textarea
              value={tailorJobDescription}
              onChange={(e) => setTailorJobDescription(e.target.value)}
              className="mt-4 h-52 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
              placeholder="Paste job description here..."
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTailorModalOpen(false)}
                className="rounded-lg border border-white/10 bg-[#0A0F0D] px-4 py-2 text-sm text-[#FFFFFF]/72"
              >
                Cancel
              </button>
              <FeatureButton
                feature="jds"
                onClick={handleTailorResume}
                disabled={isTailoring}
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {isTailoring ? 'Tailoring...' : 'Apply Tailoring'}
              </FeatureButton>
            </div>
          </div>
        </div>
      ) : null}

      {showBeforeAfterModal && fixPatches.length > 0 && (
        <BeforeAfterModal patches={fixPatches} onClose={() => setShowBeforeAfterModal(false)} />
      )}

      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
    </div>
  )
}


