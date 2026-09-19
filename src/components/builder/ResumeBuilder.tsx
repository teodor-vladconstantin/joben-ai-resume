"use client"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, User, Briefcase, GraduationCap, Code, Cpu, Save, Download, Trash2, FileText, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { TemplateSwitcher, type TemplateValue } from '@/components/builder/TemplateSwitcher'
import { HarvardTemplate } from '@/components/templates/HarvardTemplate'
import { AddContentModal, type AddableSection } from '@/components/builder/AddContentModal'
import { SectionPanel } from '@/components/builder/SectionPanel'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'
import { MonthYearRangeField } from '@/components/ui/MonthYearRangeField'
import { RichTextarea } from '@/components/ui/RichTextarea'
import { FeatureButton } from '@/components/FeatureButton'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'
import { BeforeAfterModal, type FixPatchWithContext } from '@/components/ui/BeforeAfterModal'
import { AILoadingState } from '@/components/ui/AILoadingState'

type ResumeTemplate = TemplateValue

// Sentinel experienceId marking the synthetic "professional summary" patch
// inside a tailor confirm batch — never a real experience entry id — so
// applyConfirmedClaimPatches knows to write it to personal.summary instead
// of a bullet field.
const SUMMARY_PATCH_ID = '__summary__'

function normalizeTemplate(): ResumeTemplate {
  // Only Harvard exists today — Modern was removed after shipping with
  // unfixed LaTeX export bugs. Migrate any stored value to Harvard rather
  // than trusting it.
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
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description: string
  bullets?: string[]
}

type ProjectEntry = {
  id: string
  name: string
  role?: string
  period?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description: string
  bullets?: string[]
  technologies: string[]
  url?: string
}

type EducationEntry = {
  id: string
  institution: string
  degree?: string
  field?: string
  location?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent?: boolean
  description?: string
}

type ImportMeta = {
  pdfImportsCount: number
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
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  education: EducationEntry[]
  dynamicSections: DynamicSection[]
  importMeta?: ImportMeta
}

type SummaryGenerationMode = 'resume' | 'scratch'

type BulletDraftState = {
  draft: string
  isLoading: boolean
  error: string | null
  newClaims?: string[]
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
}

function parsePeriodString(period: string): Partial<Pick<ExperienceEntry, 'startMonth' | 'startYear' | 'endMonth' | 'endYear' | 'isCurrent'>> {
  if (!period || period === 'Start - End') return {}
  const parts = period.split(/\s*[-–—]\s*/)
  if (parts.length < 2) return {}

  const parseDate = (str: string): { month?: number; year?: number } => {
    const s = str.trim()
    const m1 = s.match(/([a-zA-Z]+)\s+(\d{4})/)
    if (m1) return { month: MONTH_NAME_MAP[m1[1].toLowerCase()], year: parseInt(m1[2]) }
    const m2 = s.match(/(\d{1,2})[/.](\d{4})/)
    if (m2) return { month: parseInt(m2[1]), year: parseInt(m2[2]) }
    const m3 = s.match(/(\d{4})/)
    if (m3) return { year: parseInt(m3[1]) }
    return {}
  }

  const start = parseDate(parts[0])
  const isCurrent = /present|current|ongoing|now/i.test(parts[1])
  const end = isCurrent ? {} : parseDate(parts[1])

  return {
    startMonth: start.month,
    startYear: start.year,
    endMonth: end.month,
    endYear: end.year,
    isCurrent,
  }
}

type DateFields = { startMonth?: number; startYear?: number; endMonth?: number; endYear?: number; isCurrent?: boolean }

function computePeriod(entry: DateFields): string {
  const startLabel = entry.startYear
    ? (entry.startMonth ? `${MONTH_LABELS[entry.startMonth - 1]} ${entry.startYear}` : `${entry.startYear}`)
    : ''
  const endLabel = entry.isCurrent
    ? 'Present'
    : entry.endYear
      ? (entry.endMonth ? `${MONTH_LABELS[entry.endMonth - 1]} ${entry.endYear}` : `${entry.endYear}`)
      : ''
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`
  return startLabel || endLabel || ''
}

function splitCombinedBullet(value: string): string[] {
  const cleaned = value.trim()
  if (!cleaned) return []

  // Newlines are the strongest separator: they map directly to one-bullet-per-line.
  const newlineSplit = cleaned.split(/\r?\n+/).map((s) => s.trim()).filter(Boolean)
  if (newlineSplit.length > 1) return newlineSplit

  const bulletSplit = cleaned.split(/\s*[•·▪◦●○▸▶➤➢✓✔]\s+/)
  if (bulletSplit.length > 1) return bulletSplit.map((s) => s.trim()).filter(Boolean)

  const numberedSplit = cleaned.split(/(?<!\d)\d{1,2}[.)]\s+/)
  if (numberedSplit.length > 1) {
    const parts = numberedSplit.map((s) => s.trim()).filter(Boolean)
    if (parts.length > 1) return parts
  }

  const sentenceSplit = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean)
  return sentenceSplit.length > 1 ? sentenceSplit : [cleaned]
}

function normalizeExperienceBullets(
  input: unknown,
  fallbackDescription?: string,
  options?: { keepEmpty?: boolean }
): string[] {

  if (Array.isArray(input) && input.length > 0) {
    const rawBullets = input.map((item) => (typeof item === 'string' ? item : ''))

    if (options?.keepEmpty) {
      const nonEmpty = rawBullets.map((item) => item.trim()).filter(Boolean)
      if (nonEmpty.length === 1) return splitCombinedBullet(nonEmpty[0])
      return rawBullets
    }

    const normalizedBullets = rawBullets.map((item) => item.trim()).filter(Boolean)
    if (normalizedBullets.length === 1) return splitCombinedBullet(normalizedBullets[0])
    if (normalizedBullets.length > 0) return normalizedBullets
  }

  if (typeof fallbackDescription === 'string' && fallbackDescription.trim()) {
    return splitCombinedBullet(fallbackDescription)
  }

  return ['']
}

function normalizeExperienceEntry(entry: Partial<ExperienceEntry>): ExperienceEntry {
  const bullets = normalizeExperienceBullets(entry.bullets, entry.description, { keepEmpty: true })
  const description =
    bullets.find((bullet) => bullet.trim().length > 0) ||
    (typeof entry.description === 'string' ? entry.description.trim() : '')

  // If structured date fields are missing, derive them from the period string
  const hasStructured = entry.startYear !== undefined || entry.endYear !== undefined
  const derived = hasStructured ? {} : parsePeriodString(entry.period || '')

  return {
    id: entry.id || `exp_${Date.now()}`,
    title: entry.title || '',
    company: entry.company || '',
    period: entry.period || '',
    startMonth: entry.startMonth ?? derived.startMonth,
    startYear: entry.startYear ?? derived.startYear,
    endMonth: entry.endMonth ?? derived.endMonth,
    endYear: entry.endYear ?? derived.endYear,
    isCurrent: entry.isCurrent ?? derived.isCurrent,
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

function normalizeProjectEntry(entry: Partial<ProjectEntry>): ProjectEntry {
  const description = entry.description || ''
  // Bullets are a derived view of the description — re-deriving every time keeps the
  // builder textarea, the live preview, and the exported PDF in lockstep when the user
  // edits the description (one bullet per non-empty line).
  const derivedBullets = description ? splitCombinedBullet(description) : []
  const incomingBullets = Array.isArray(entry.bullets)
    ? entry.bullets.map((bullet) => (typeof bullet === 'string' ? bullet.trim() : '')).filter(Boolean)
    : []
  const bullets = derivedBullets.length > 0 ? derivedBullets : incomingBullets

  return {
    id: entry.id || `proj_${Date.now()}`,
    name: entry.name || '',
    role: entry.role || '',
    period: entry.period || '',
    startMonth: entry.startMonth,
    startYear: entry.startYear,
    endMonth: entry.endMonth,
    endYear: entry.endYear,
    isCurrent: entry.isCurrent ?? false,
    description,
    bullets,
    technologies: Array.isArray(entry.technologies) ? entry.technologies.filter((tech) => typeof tech === 'string') : [],
    url: entry.url || '',
  }
}

function getProjectTechnologies(project: ProjectEntry): string[] {
  return Array.isArray(project.technologies)
    ? project.technologies.map((tech) => tech.trim()).filter(Boolean)
    : []
}

function normalizeEducationEntry(entry: Partial<EducationEntry>): EducationEntry {
  const description = typeof entry.description === 'string' ? entry.description.trim() : ''
  return {
    id: entry.id || `edu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    institution: typeof entry.institution === 'string' ? entry.institution.trim() : '',
    degree: typeof entry.degree === 'string' ? entry.degree.trim() : '',
    field: typeof entry.field === 'string' ? entry.field.trim() : '',
    location: typeof entry.location === 'string' ? entry.location.trim() : '',
    startMonth: typeof entry.startMonth === 'number' ? entry.startMonth : undefined,
    startYear: typeof entry.startYear === 'number' ? entry.startYear : undefined,
    endMonth: typeof entry.endMonth === 'number' ? entry.endMonth : undefined,
    endYear: typeof entry.endYear === 'number' ? entry.endYear : undefined,
    isCurrent: entry.isCurrent ?? false,
    description,
  }
}

/**
 * Migrate legacy `dynamicSections[type=education]` text blobs into structured
 * `EducationEntry` cards. Each blank-line-separated block becomes one card; the
 * first line is treated as the institution and the remaining lines are folded
 * into `degree` (line 2) and `description` (everything else, including periods
 * we cannot reliably parse without a structured source).
 */
function migrateLegacyEducationSections(
  dynamicSections: DynamicSection[]
): { education: EducationEntry[]; remaining: DynamicSection[] } {
  const education: EducationEntry[] = []
  const remaining: DynamicSection[] = []

  for (const section of dynamicSections) {
    if (section.type !== 'education') {
      remaining.push(section)
      continue
    }

    const blocks = (section.content || '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)

    if (blocks.length === 0) continue

    for (const block of blocks) {
      const lines = block.split(/\n+/).map((line) => line.trim()).filter(Boolean)
      if (lines.length === 0) continue
      const [institution, degreeLine, ...rest] = lines
      education.push(
        normalizeEducationEntry({
          institution,
          degree: degreeLine || '',
          description: rest.join('\n'),
        })
      )
    }
  }

  return { education, remaining }
}

const initialResumeData: ResumeData = {
  template: 'harvard',
  personal: { firstName: '', lastName: '', title: '', email: '', phone: '', summary: '', linkedin: '', github: '' },
  experience: [],
  projects: [],
  education: [],
  dynamicSections: [],
  importMeta: { pdfImportsCount: 0 },
}

const tabSectionMap: Record<string, AddableSection['type'][]> = {
  education: ['education'],
  skills: ['skills'],
  projects: ['projects'],
  certifications: ['certifications'],
  sections: ['professional_summary', 'career_objective', 'leadership', 'research', 'awards', 'publications'],
}

const MAX_PDF_IMPORTS_PER_RESUME = 3
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

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

function getPdfImportCount(data: ResumeData): number {
  const count = data.importMeta?.pdfImportsCount ?? 0
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
}


export function ResumeBuilder() {
  const t = useTranslations('Builder')
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
  const [missingSkills, setMissingSkills] = useState<string[]>([])
  const [bulletDraftStates, setBulletDraftStates] = useState<Record<string, BulletDraftState>>({})
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadWarning, setShowUploadWarning] = useState(false)
  const [showImportLimitModal, setShowImportLimitModal] = useState(false)
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState(t('upgradeDefaultMessage'))
  const [highlightedBulletIndex, setHighlightedBulletIndex] = useState<number | null>(null)
  const [fixBanner, setFixBanner] = useState<string | null>(null)
  const [fixPatches, setFixPatches] = useState<FixPatchWithContext[]>([])
  const [showBeforeAfterModal, setShowBeforeAfterModal] = useState(false)
  const [pendingClaimPatches, setPendingClaimPatches] = useState<FixPatchWithContext[]>([])
  const [showClaimConfirmModal, setShowClaimConfirmModal] = useState(false)
  const [isSummaryGeneratorOpen, setIsSummaryGeneratorOpen] = useState(false)
  const [summaryGenerationMode, setSummaryGenerationMode] = useState<SummaryGenerationMode>('resume')
  const [summaryRoleDescription, setSummaryRoleDescription] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummaryDraft, setGeneratedSummaryDraft] = useState('')
  const [summaryGenerationError, setSummaryGenerationError] = useState<string | null>(null)
  const [pendingBulletScrollKey, setPendingBulletScrollKey] = useState<string | null>(null)
  const creationSourceRef = useRef<'import' | 'scratch'>('scratch')
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const routeResumeId = params?.id
  const isCreateMode = routeResumeId === 'new' || !routeResumeId

  const derivedTitle = useMemo(() => {
    return `${resumeData.personal.firstName} ${resumeData.personal.lastName}`.trim() || t('untitledResumeFallback')
  }, [resumeData.personal.firstName, resumeData.personal.lastName, t])

  const tabs = [
    { id: 'personal', label: t('tabs.personal'), icon: User },
    { id: 'experience', label: t('tabs.experience'), icon: Briefcase },
    { id: 'education', label: t('tabs.education'), icon: GraduationCap },
    { id: 'skills', label: t('tabs.skills'), icon: Code },
    { id: 'projects', label: t('tabs.projects'), icon: Cpu },
    { id: 'certifications', label: t('tabs.certifications'), icon: Award },
    { id: 'sections', label: t('tabs.sections'), icon: FileText },
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
        data?: {
          resume?: {
            id: string
            data?: ResumeData
          }
        }
      }

      if (cancelled) return

      const resumePayload = payload.data?.resume || payload.resume

      if (resumePayload) {
        setResumeId(resumePayload.id)
        const loadedData = resumePayload.data
        if (loadedData) {
          setResumeData((prev) => {
            const incomingExperience = Array.isArray(loadedData.experience)
              ? loadedData.experience.map((exp) => normalizeExperienceEntry(exp as Partial<ExperienceEntry>))
              : prev.experience
            const incomingProjects = Array.isArray(loadedData.projects)
              ? loadedData.projects.map((project) => normalizeProjectEntry(project as Partial<ProjectEntry>))
              : prev.projects
            const rawDynamic = Array.isArray(loadedData.dynamicSections)
              ? (loadedData.dynamicSections as DynamicSection[])
              : prev.dynamicSections
            const hasStructuredEducation =
              Array.isArray((loadedData as { education?: unknown }).education) &&
              ((loadedData as { education?: unknown[] }).education?.length || 0) > 0

            // Two paths:
            //  • New CVs persist `education[]` directly; reuse it verbatim.
            //  • Legacy CVs only ship education as a `dynamicSections[type=education]`
            //    text blob; fold those into structured cards on load and strip the
            //    legacy entries so we never render the same data twice.
            let nextEducation: EducationEntry[]
            let nextDynamic: DynamicSection[]
            if (hasStructuredEducation) {
              nextEducation = (
                (loadedData as { education: Partial<EducationEntry>[] }).education
              ).map((entry) => normalizeEducationEntry(entry))
              nextDynamic = rawDynamic.filter((section) => section.type !== 'education')
            } else {
              const migrated = migrateLegacyEducationSections(rawDynamic)
              nextEducation = migrated.education
              nextDynamic = migrated.remaining
            }

            return {
              template: normalizeTemplate(),
              personal: { ...prev.personal, ...(loadedData.personal || {}) },
              experience: incomingExperience,
              projects: incomingProjects,
              education: nextEducation,
              dynamicSections: nextDynamic,
              importMeta: loadedData.importMeta || prev.importMeta,
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
          ? t('fixBanner.applied', { count })
          : t('fixBanner.autoFixComplete')
      )
    } else if (fixApplied === 'true') {
      setFixBanner(t('fixBanner.fixApplied'))
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
  }, [isLoading, searchParams, resumeData.experience, t])

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

    // `derivedTitle` falls back to 'Untitled Resume' whenever firstName/lastName
    // are empty (e.g. a PDF-imported or manually-titled resume whose structured
    // personal fields were never filled in). Only send `title` on updates when
    // it's a real, name-derived value -- otherwise omit it from the PATCH body
    // so the existing DB title (curated or imported) is left untouched instead
    // of being silently overwritten back to 'Untitled Resume' on every autosave.
    const hasDerivedName = derivedTitle !== t('untitledResumeFallback')
    const payload = {
      title: derivedTitle,
      data: resumeData,
    }

    if (!resumeId && isCreateMode) {
      const createRes = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, source: creationSourceRef.current }),
      })

      if (!createRes.ok) {
        try {
          const errorPayload = (await createRes.json()) as {
            error?: string
            showUpgrade?: boolean
          }

          if (errorPayload.showUpgrade) {
            setUpgradeMessage(errorPayload.error || t('save.upgradeMessage'))
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
      body: JSON.stringify(hasDerivedName ? payload : { data: resumeData }),
    })

    setSaveStatus(updateRes.ok ? 'saved' : 'error')
  }, [derivedTitle, isCreateMode, resumeData, resumeId, routeResumeId, router, t])

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
    setResumeData((prev) => {
      const incomingDynamic = (data.dynamicSections ?? []).map((s, i) => ({
        id: s.id || `section_${i}`,
        type: s.type as DynamicSection['type'],
        title: s.title || '',
        content: s.content || '',
      }))

      // Prefer the parser's structured `education[]` if present; otherwise fold
      // legacy text-based education sections into structured cards so the user
      // can edit each entry as a real form.
      let nextEducation: EducationEntry[]
      let nextDynamic: DynamicSection[]
      if (Array.isArray(data.education) && data.education.length > 0) {
        nextEducation = data.education.map((entry) => normalizeEducationEntry(entry))
        nextDynamic = incomingDynamic.filter((section) => section.type !== 'education')
      } else {
        const migrated = migrateLegacyEducationSections(incomingDynamic)
        nextEducation = migrated.education
        nextDynamic = migrated.remaining
      }

      return {
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
        projects: (data.projects ?? []).map((project) => normalizeProjectEntry(project)),
        education: nextEducation,
        dynamicSections: nextDynamic,
        importMeta: {
          pdfImportsCount: Math.min(getPdfImportCount(prev) + 1, MAX_PDF_IMPORTS_PER_RESUME),
        },
      }
    })
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
          setUpgradeMessage(err.error || t('export.upgradeMessage'))
          setShowUpgradeModal(true)
          setSaveStatus('error')
          return
        }

        alert(err.error || t('export.genericError'))
        setSaveStatus('error')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${derivedTitle || t('exportFilenameFallback')}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setSaveStatus('saved')
    } catch {
      alert(t('export.networkError'))
      setSaveStatus('error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const updateExperienceMetaField = (
    experienceId: string,
    field: 'title' | 'company',
    value: string
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === experienceId ? { ...exp, [field]: value } : exp
      ),
    }))
  }

  const updateExperienceDateField = (
    experienceId: string,
    field: 'startMonth' | 'startYear' | 'endMonth' | 'endYear' | 'isCurrent',
    value: number | boolean | undefined
  ) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => {
        if (exp.id !== experienceId) return exp
        const updated = { ...exp, [field]: value }
        return { ...updated, period: computePeriod(updated) }
      }),
    }))
  }

  const updateProjectDateField = (
    projectId: string,
    field: 'startMonth' | 'startYear' | 'endMonth' | 'endYear' | 'isCurrent',
    value: number | boolean | undefined
  ) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) => {
        if (proj.id !== projectId) return proj
        const updated = { ...proj, [field]: value }
        return { ...updated, period: computePeriod(updated) }
      }),
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
    if (confirm(t('experience.confirmDelete'))) {
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
      title: t('experience.newRoleTitle'),
      company: t('experience.newRoleCompany'),
      period: 'Start - End',
      description: t('experience.newRoleDescription'),
      bullets: [t('experience.newRoleDescription')],
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
    // Education is now a structured field (not a free-text dynamic section).
    // Redirect to the dedicated handler so the user gets a real form.
    if (section.type === 'education') {
      handleAddEducation()
      setActiveTab('education')
      setIsAddModalOpen(false)
      return
    }

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

  const handleAddProject = () => {
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        normalizeProjectEntry({
          id: `proj_${Date.now()}`,
          name: '',
          description: '',
          technologies: [],
          url: '',
        }),
      ],
    }))
  }

  const updateProjectField = (projectId: string, patch: Partial<ProjectEntry>) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId ? normalizeProjectEntry({ ...project, ...patch }) : project
      ),
    }))
  }

  const updateProjectTechnologies = (projectId: string, technologiesText: string) => {
    const technologies = technologiesText
      .split(',')
      .map((tech) => tech.trim())
      .filter(Boolean)

    updateProjectField(projectId, { technologies })
  }

  const deleteProject = (projectId: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((project) => project.id !== projectId),
    }))
  }

  const handleAddEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        normalizeEducationEntry({
          id: `edu_${Date.now()}`,
          institution: '',
          degree: '',
        }),
      ],
    }))
  }

  const updateEducationField = (
    educationId: string,
    field: 'institution' | 'degree' | 'field' | 'location' | 'description',
    value: string
  ) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((entry) =>
        entry.id === educationId ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const updateEducationDateField = (
    educationId: string,
    field: 'startMonth' | 'startYear' | 'endMonth' | 'endYear' | 'isCurrent',
    value: number | boolean | undefined
  ) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((entry) =>
        entry.id === educationId ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const deleteEducation = (educationId: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((entry) => entry.id !== educationId),
    }))
  }

  const deleteDynamicSection = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      dynamicSections: prev.dynamicSections.filter((section) => section.id !== id),
    }))
  }

  const validateUploadFile = (file: File) => {
    if (!isValidResumeFile(file)) {
      setUploadError(t('upload.invalidFileType'))
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(t('upload.fileTooLarge'))
      return false
    }

    if (getPdfImportCount(resumeData) >= MAX_PDF_IMPORTS_PER_RESUME) {
      setUploadError(null)
      setShowImportLimitModal(true)
      return false
    }

    return true
  }

  const startUploadFlow = (file: File) => {
    setUploadError(null)
    setShowImportLimitModal(false)
    if (!validateUploadFile(file)) return
    setPendingUploadFile(file)
    setShowUploadWarning(true)
  }

  const finalizeUpload = async () => {
    if (!pendingUploadFile || isImportingPdf) return

    setShowUploadWarning(false)
    setIsImportingPdf(true)
    setUploadError(null)

    try {
      const result = await importPdfClientSide(pendingUploadFile)
      handleOnboardingImport(result.data)
      creationSourceRef.current = 'import'
      setActiveTab('personal')
      setPendingUploadFile(null)
    } catch (err) {
      // Keep pendingUploadFile so the error banner's "Try again" can resubmit
      // the same file directly, without sending the user back through the
      // file picker for what's usually a transient upstream failure.
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setIsImportingPdf(false)
    }
  }

  const cancelUpload = () => {
    setShowUploadWarning(false)
    setPendingUploadFile(null)
  }

  const dismissUploadError = () => {
    setUploadError(null)
    setPendingUploadFile(null)
  }

  const closeImportLimitModal = () => {
    setShowImportLimitModal(false)
  }

  const handleTailorResume = async () => {
    if (!tailorJobDescription.trim()) {
      alert(t('tailor.missingJobDescription'))
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
          updatedBullets?: Array<{
            jobIndex: number
            bulletIndex: number
            text: string
            newClaims?: string[]
          }>
          summary?: string
          missingSkills?: string[]
        }
        showUpgrade?: boolean
        error?: string
      }

      if (!response.ok || !payload.result) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || t('tailor.upgradeMessage'))
          setShowUpgradeModal(true)
          setIsTailoring(false)
          return
        }
        alert(payload.error || t('tailor.genericError'))
        setIsTailoring(false)
        return
      }

      const updatedBullets = payload.result.updatedBullets || []
      setMissingSkills(payload.result.missingSkills || [])

      // Every proposed bullet — not just ones flagged with newClaims — goes
      // through BeforeAfterModal for explicit accept. Nothing is written to
      // resumeData here; applyConfirmedClaimPatches does that once the user
      // confirms (and, for flagged bullets, checks the required box).
      //
      // Each item is matched back to its job via the API's explicit
      // jobIndex/bulletIndex (resumeData.experience[jobIndex]) — never by
      // its position in this array. Positional matching is exactly what
      // previously let a bullet from one job come back applied to a
      // different job.
      const pending: FixPatchWithContext[] = updatedBullets.reduce<FixPatchWithContext[]>(
        (acc, item) => {
          const exp = resumeData.experience[item.jobIndex]
          if (!exp) return acc

          const existingBullets = getExperienceBullets(exp)
          acc.push({
            experienceId: exp.id,
            bulletIndex: item.bulletIndex,
            originalBullet: existingBullets[item.bulletIndex] || '',
            updatedBullet: item.text,
            experienceTitle: exp.title,
            company: exp.company,
            newClaims: item.newClaims || [],
          })
          return acc
        },
        []
      )

      // The proposed summary goes through the exact same confirm modal as a
      // synthetic patch — it must never be applied silently. A prior version
      // wrote it straight into resumeData as a side effect of confirming
      // bullets (or dropped it entirely if no bullets needed confirmation),
      // so a user could accept a rewritten bullet and have the summary
      // change underneath them unseen.
      const proposedSummary = (payload.result.summary || '').trim()
      const currentSummary = (resumeData.personal.summary || '').trim()
      if (proposedSummary && proposedSummary !== currentSummary) {
        pending.unshift({
          experienceId: SUMMARY_PATCH_ID,
          bulletIndex: -1,
          originalBullet: currentSummary,
          updatedBullet: proposedSummary,
          experienceTitle: t('tailor.summaryPatchLabel'),
        })
      }

      if (pending.length > 0) {
        setPendingClaimPatches(pending)
        setShowClaimConfirmModal(true)
      }

      setIsTailorModalOpen(false)
    } catch (error) {
      alert(t('tailor.failed', { message: (error as Error).message }))
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
          error: t('bulletDraft.emptyBulletError'),
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
          // Includes every other bullet in this role, not just title/company/
          // period — the anti-hallucination check needs to see sibling
          // bullets so a number/tool already present elsewhere in the same
          // job isn't flagged as a new claim.
          context: [
            `${target.title} at ${target.company} (${target.period})`,
            ...targetBullets.filter((_, index) => index !== bulletIndex),
          ].join('\n'),
        }),
      })

      const payload = (await response.json()) as {
        bullet?: string
        newClaims?: string[]
        showUpgrade?: boolean
        error?: string
        currentPlan?: 'free' | 'pro' | 'recruiting'
        limit?: number
        remaining?: number
        resetAt?: number
      }

      if (!response.ok || !payload.bullet) {
        let errorMessage = payload.error || t('bulletDraft.genericError')

        if (response.status === 429) {
          const details: string[] = [payload.error || t('bulletDraft.dailyLimitReached')]

          if (typeof payload.remaining === 'number' && typeof payload.limit === 'number') {
            details.push(t('bulletDraft.remainingInWindow', { remaining: payload.remaining, limit: payload.limit }))
          }

          if (typeof payload.resetAt === 'number') {
            details.push(t('bulletDraft.resetsAt', { time: new Date(payload.resetAt).toLocaleString() }))
          }

          errorMessage = details.join('\n')

          if (payload.showUpgrade && payload.currentPlan !== 'pro') {
            setUpgradeMessage(errorMessage)
            setShowUpgradeModal(true)
          }
        } else if (payload.showUpgrade) {
          errorMessage = payload.error || t('bulletDraft.upgradeMessage')
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
          newClaims: payload.newClaims || [],
        },
      }))
    } catch (error) {
      setBulletDraftStates((prev) => ({
        ...prev,
        [draftKey]: {
          draft: prev[draftKey]?.draft || '',
          isLoading: false,
          error: t('bulletDraft.draftFailed', { message: (error as Error).message }),
        },
      }))
    }
  }

  // Shared by both improve-bullet's inline accept and tailor's apply: writes
  // confirmed patches into resumeData and clears any matching bulletDraftStates
  // entries (a no-op for patches that didn't come from that flow).
  const applyConfirmedClaimPatches = (patches: FixPatchWithContext[]) => {
    patches.forEach((patch) => {
      if (patch.experienceId === SUMMARY_PATCH_ID) {
        setResumeData((prev) => ({
          ...prev,
          personal: { ...prev.personal, summary: patch.updatedBullet },
        }))
        return
      }
      updateExperienceBulletField(patch.experienceId, patch.bulletIndex, patch.updatedBullet)
    })
    setBulletDraftStates((prev) => {
      const next = { ...prev }
      for (const patch of patches) {
        if (patch.experienceId === SUMMARY_PATCH_ID) continue
        delete next[getBulletFieldKey(patch.experienceId, patch.bulletIndex)]
      }
      return next
    })
    setPendingClaimPatches([])
    setShowClaimConfirmModal(false)
  }

  const handleAcceptBulletDraft = (experienceId: string, bulletIndex: number) => {
    const draftKey = getBulletFieldKey(experienceId, bulletIndex)
    const draftState = bulletDraftStates[draftKey]
    const draft = draftState?.draft?.trim()
    if (!draft) return

    if (draftState?.newClaims && draftState.newClaims.length > 0) {
      const target = resumeData.experience.find((item) => item.id === experienceId)
      const originalBullet = target ? getExperienceBullets(target)[bulletIndex] || '' : ''
      setPendingClaimPatches([
        {
          experienceId,
          bulletIndex,
          originalBullet,
          updatedBullet: draft,
          experienceTitle: target?.title,
          company: target?.company,
          newClaims: draftState.newClaims,
        },
      ])
      setShowClaimConfirmModal(true)
      return
    }

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
      setSummaryGenerationError(t('summary.missingRoleDescription'))
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
        setSummaryGenerationError(payload.error || t('summary.genericError'))
        setIsGeneratingSummary(false)
        return
      }

      setGeneratedSummaryDraft(payload.summary)
    } catch (error) {
      setSummaryGenerationError(t('summary.generationFailed', { message: (error as Error).message }))
    }

    setIsGeneratingSummary(false)
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:min-w-315 lg:flex-row print:block" suppressHydrationWarning>
      {/* Editor Sidebar */}
      <div
        className="w-full min-h-0 bg-(--surface) border-r border-(--border) flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden z-10 lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden"
        suppressHydrationWarning
      >
        <input
          ref={importInputRef}
          id="pdf-import-input"
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              startUploadFlow(file)
              e.currentTarget.value = ''
            }
          }}
        />
        <div
          className="shrink-0 border-b border-(--border) px-4 pt-5 pb-4 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden custom-scrollbar tabs-scrollbar scroll-smooth"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-w-35 items-center justify-center gap-2 px-4 py-2.5 rounded-none text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id
                ? 'bg-(--accent-muted) text-(--foreground) border border-(--border)'
                : 'text-(--muted) hover:bg-(--surface-elevated) hover:text-(--foreground) border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 p-4 pt-5 border-b border-(--border) space-y-3">
          <TemplateSwitcher
            value={resumeData.template}
            onChange={(value) =>
              setResumeData((prev) => ({
                ...prev,
                template: value,
              }))
            }
          />
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 rounded-none border border-(--border) bg-(--accent-muted) px-3 py-2 text-sm font-semibold text-(--foreground) hover:bg-(--accent)/20 transition-colors duration-150 ease-out"
            >
              {t('sections.addSection')}
            </button>
            <button
              onClick={() => {
                if (getPdfImportCount(resumeData) >= MAX_PDF_IMPORTS_PER_RESUME) {
                  setShowImportLimitModal(true)
                  return
                }
                importInputRef.current?.click()
              }}
              disabled={isImportingPdf}
              className="flex-1 rounded-none border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground) hover:bg-(--surface-elevated) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPdf
                ? t('imports.importing')
                : t('imports.importButton', { count: getPdfImportCount(resumeData), max: MAX_PDF_IMPORTS_PER_RESUME })}
            </button>
            <FeatureButton
              feature="jds"
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-none border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground) hover:bg-(--surface-elevated) transition-colors duration-150 ease-out"
            >
              {t('tailor.aiTailorButton')}
            </FeatureButton>
          </div>
        </div>

        {missingSkills.length > 0 ? (
          <div className="shrink-0 mx-4 mt-3 rounded-none border border-(--border) bg-(--surface) px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-semibold text-(--foreground)">
                {t('tailor.missingSkillsHeading')}
              </p>
              <button
                onClick={() => setMissingSkills([])}
                className="text-(--muted) hover:text-(--foreground) text-xs shrink-0"
              >
                x
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-none border border-(--border) bg-(--accent-muted) px-2.5 py-1 text-xs font-medium text-(--foreground)"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {fixBanner ? (
          <div className="shrink-0 mx-4 mt-3 rounded-none border border-(--border) bg-(--accent-muted) px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-(--foreground) font-medium">{fixBanner}</p>
            <button
              onClick={() => setFixBanner(null)}
              className="text-(--muted) hover:text-(--foreground) text-xs shrink-0"
            >
              x
            </button>
          </div>
        ) : null}

        {uploadError ? (
          <div className="shrink-0 mx-4 mt-3 flex gap-3 rounded-none border border-(--border) border-l-2 border-l-(--foreground) px-4 py-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-(--foreground)" />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <p className="text-sm text-(--foreground)">{uploadError}</p>
              <div className="flex shrink-0 items-center gap-2">
                {pendingUploadFile ? (
                  <button
                    onClick={finalizeUpload}
                    disabled={isImportingPdf}
                    className="rounded-none border border-(--border) px-2.5 py-1 text-xs font-semibold text-(--foreground) hover:bg-(--surface-elevated) disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-150 ease-out"
                  >
                    {isImportingPdf ? t('imports.retrying') : t('imports.tryAgain')}
                  </button>
                ) : null}
                <button
                  onClick={dismissUploadError}
                  className="text-(--muted) hover:text-(--foreground) text-xs shrink-0 transition-colors duration-150 ease-out"
                >
                  x
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar builder-panel-scrollbar"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {activeTab === 'personal' && (
            <div className="space-y-4" suppressHydrationWarning>
              <h2 className="text-xl font-bold text-(--foreground) mb-6">{t('personal.heading')}</h2>
              {/* Form fields would be controlled components, omitted for brevity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.firstNameLabel')}</label>
                  <input type="text" value={resumeData.personal.firstName} onChange={(e) => updatePersonalField('firstName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.firstNamePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.lastNameLabel')}</label>
                  <input type="text" value={resumeData.personal.lastName} onChange={(e) => updatePersonalField('lastName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.lastNamePlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">{t('personal.jobTitleLabel')}</label>
                <input type="text" value={resumeData.personal.title} onChange={(e) => updatePersonalField('title', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.jobTitlePlaceholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.emailLabel')}</label>
                  <input type="email" value={resumeData.personal.email} onChange={(e) => updatePersonalField('email', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.emailPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.phoneLabel')}</label>
                  <input type="text" value={resumeData.personal.phone} onChange={(e) => updatePersonalField('phone', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.phonePlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">{t('personal.locationLabel')}</label>
                <input type="text" value={resumeData.personal.location || ''} onChange={(e) => updatePersonalField('location', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.locationPlaceholder')} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.summaryLabel')}</label>
                  <button
                    onClick={() => setIsSummaryGeneratorOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-none border border-(--border) bg-(--accent-muted) px-2.5 py-1 text-xs font-semibold text-(--foreground) hover:bg-(--accent)/20 transition-colors duration-150 ease-out"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('personal.generateWithAi')}
                  </button>
                </div>

                <RichTextarea
                  value={resumeData.personal.summary}
                  onValueChange={(value) => updatePersonalField('summary', value)}
                  className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors h-28 resize-none"
                  placeholder={t('personal.summaryPlaceholder')}
                  toolbarLabel={t('personal.summaryToolbarLabel')}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.linkedinLabel')}</label>
                  <input type="text" value={resumeData.personal.linkedin || ''} onChange={(e) => updatePersonalField('linkedin', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.linkedinPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.githubLabel')}</label>
                  <input type="text" value={resumeData.personal.github || ''} onChange={(e) => updatePersonalField('github', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.githubPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">{t('personal.websiteLabel')}</label>
                  <input type="text" value={resumeData.personal.website || ''} onChange={(e) => updatePersonalField('website', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-sm px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder={t('personal.websitePlaceholder')} />
                </div>

                {isSummaryGeneratorOpen ? (
                  <div className="rounded-sm border border-(--border) bg-(--background) p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSummaryGenerationMode('resume')}
                        className={`rounded-none px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'resume'
                            ? 'border border-(--border) bg-(--accent-muted) text-(--foreground)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        {t('personal.summaryModeResume')}
                      </button>
                      <button
                        onClick={() => setSummaryGenerationMode('scratch')}
                        className={`rounded-none px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'scratch'
                            ? 'border border-(--border) bg-(--accent-muted) text-(--foreground)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        {t('personal.summaryModeScratch')}
                      </button>
                    </div>

                    {summaryGenerationMode === 'scratch' ? (
                      <textarea
                        value={summaryRoleDescription}
                        onChange={(e) => setSummaryRoleDescription(e.target.value)}
                        className="h-24 w-full resize-none rounded-sm border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('personal.summaryRolePlaceholder')}
                      />
                    ) : null}

                    {isGeneratingSummary ? (
                      <div className="rounded-none border border-(--border) bg-(--surface)">
                        <AILoadingState stage="generating" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsSummaryGeneratorOpen(false)}
                          className="rounded-none border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground)"
                        >
                          {t('personal.summaryGenClose')}
                        </button>
                        <button
                          onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                          className={`rounded-none text-xs ${buttonVariants('primary', 'sm')}`}
                        >
                          {t('personal.generateSummaryButton')}
                        </button>
                      </div>
                    )}

                    {summaryGenerationError ? (
                      <p className="text-xs text-(--foreground) border-l-2 border-(--foreground) pl-2">{summaryGenerationError}</p>
                    ) : null}

                    <AnimatePresence>
                      {generatedSummaryDraft ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="rounded-none border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                        >
                          <p className="font-mono text-(length:--text-label) text-(--muted)">{t('ai.aiDraft')}</p>
                          <p className="text-sm text-(--foreground)/95 leading-relaxed">{generatedSummaryDraft}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                              disabled={isGeneratingSummary}
                              className="rounded-none border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {t('ai.regenerate')}
                            </button>
                            <button
                              onClick={() => updatePersonalField('summary', generatedSummaryDraft)}
                              className="rounded-none bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--accent-ink) hover:bg-(--accent)"
                            >
                              {t('personal.acceptSummaryButton')}
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
                <h2 className="text-xl font-bold text-(--foreground)">{t('experience.heading')}</h2>
                <button onClick={handleAddRole} className="text-(--foreground) text-sm font-medium border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{t('experience.addRole')}</button>
              </div>

              {resumeData.experience.map((exp, expIndex) => {
                const experienceBullets = getExperienceBullets(exp)
                const globalBulletOffset = resumeData.experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)

                return (
                 <div key={exp.id} className="bg-(--surface) border border-(--border) rounded-none p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-(--muted)">{t('experience.entryLabel')}</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-(--muted) hover:text-(--foreground) p-1 transition-colors duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-(--accent-strong) border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input
                       value={exp.title}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'title', e.target.value)}
                       className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder={t('experience.titlePlaceholder')}
                     />
                     <input
                       value={exp.company}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'company', e.target.value)}
                       className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder={t('experience.companyPlaceholder')}
                     />
                     <MonthYearRangeField
                       monthLabels={MONTH_LABELS}
                       startMonth={exp.startMonth}
                       startYear={exp.startYear}
                       endMonth={exp.endMonth}
                       endYear={exp.endYear}
                       isCurrent={exp.isCurrent ?? false}
                       onStartMonthChange={(value) => updateExperienceDateField(exp.id, 'startMonth', value)}
                       onStartYearChange={(value) => updateExperienceDateField(exp.id, 'startYear', value)}
                       onEndMonthChange={(value) => updateExperienceDateField(exp.id, 'endMonth', value)}
                       onEndYearChange={(value) => updateExperienceDateField(exp.id, 'endYear', value)}
                       onIsCurrentChange={(value) => updateExperienceDateField(exp.id, 'isCurrent', value)}
                     />

                     <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <p className="font-mono text-(length:--text-label) text-(--muted)">{t('experience.impactBulletsLabel')}</p>
                         <button
                           onClick={() => addExperienceBullet(exp.id)}
                           className="text-xs font-medium text-(--foreground) border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out"
                         >
                           {t('experience.addBullet')}
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
                             <span className="pt-9 text-(--muted)">•</span>
                             <RichTextarea
                               ref={(node) => {
                                 bulletFieldRefs.current[draftKey] = node
                               }}
                               data-bullet-global-index={globalIdx}
                               value={bullet}
                               onValueChange={(value) => updateExperienceBulletField(exp.id, bulletIndex, value)}
                               className={`h-20 w-full resize-none rounded-sm border bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:outline-none transition-colors duration-150 ease-out ${
                                 isHighlighted
                                   ? 'border-(--accent) ring-2 ring-(--accent)/30 focus:border-(--accent)'
                                   : 'border-(--border) focus:border-(--accent)'
                               }`}
                               placeholder={t('experience.bulletPlaceholder')}
                               toolbarLabel={t('experience.bulletToolbarLabel')}
                             />
                             <div className="flex flex-col gap-1 pt-7">
                               <button
                                 onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                 disabled={Boolean(draftState?.isLoading)}
                                 className="rounded-none border border-(--border) px-2 py-1 text-[11px] text-(--foreground) hover:border-(--accent) disabled:cursor-not-allowed disabled:opacity-70"
                               >
                                 {draftState?.isLoading ? t('ai.aiDraftLoading') : t('ai.aiDraft')}
                               </button>
                               <button
                                 onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                 disabled={experienceBullets.length === 1}
                                 className="rounded-none border border-(--border) px-2 py-1 text-[11px] text-(--muted) hover:border-(--accent) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-40"
                               >
                                 {t('experience.deleteBulletButton')}
                               </button>
                             </div>
                           </motion.div>

                           <p className="pl-5 text-[11px] text-(--muted)">
                             {t('ai.creditHint')}
                           </p>

                           {draftState?.isLoading ? (
                             <div className="ml-5 rounded-none border border-(--border) bg-(--background) px-3 py-2 text-xs text-(--muted)">
                               {t('ai.generatingDraft')}
                             </div>
                           ) : null}

                           {draftState?.error ? (
                             <p className="ml-5 text-xs text-(--foreground) border-l-2 border-(--foreground) pl-2 whitespace-pre-line">{draftState.error}</p>
                           ) : null}

                           <AnimatePresence>
                             {hasDraft ? (
                               <motion.div
                                 initial={{ opacity: 0, y: 8 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 8 }}
                                 transition={{ duration: 0.2, ease: 'easeOut' }}
                                 className="ml-5 rounded-none border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                               >
                                 <div className="flex items-center justify-between gap-2">
                                   <p className="font-mono text-[11px] text-(--muted)">{t('ai.aiDraft')}</p>
                                   <p className="text-[11px] text-(--muted)">{t('ai.regenerateUsesCredit')}</p>
                                 </div>
                                 <p className="text-sm text-(--foreground)/95 leading-relaxed">{draftState?.draft}</p>
                                 <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                    disabled={Boolean(draftState?.isLoading)}
                                    className="rounded-none border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                     {t('ai.regenerate')}
                                   </button>
                                   <button
                                     onClick={() => handleAcceptBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-none bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--accent-ink) hover:bg-(--accent)"
                                   >
                                     {t('ai.accept')}
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

          {activeTab === 'projects' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-(--foreground)">{t('projects.heading')}</h2>
                  <p className="mt-1 text-sm text-(--muted)">{t('projects.description')}</p>
                </div>
                <button onClick={handleAddProject} className="text-(--foreground) text-sm font-medium border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{t('projects.addProject')}</button>
              </div>

              {resumeData.projects.length === 0 ? (
                <div className="rounded-none border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  {t('projects.emptyState')}
                </div>
              ) : (
                resumeData.projects.map((project, index) => (
                  <div key={project.id} className="bg-(--surface) border border-(--border) rounded-none p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">{t('projects.entryLabel', { index: index + 1 })}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-(--muted) hover:text-(--foreground) p-1 transition-colors duration-150 ease-out"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={project.name}
                        onChange={(e) => updateProjectField(project.id, { name: e.target.value })}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('projects.namePlaceholder')}
                      />

                      <input
                        value={project.role || ''}
                        onChange={(e) => updateProjectField(project.id, { role: e.target.value })}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('projects.rolePlaceholder')}
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={project.startMonth}
                        startYear={project.startYear}
                        endMonth={project.endMonth}
                        endYear={project.endYear}
                        isCurrent={project.isCurrent ?? false}
                        onStartMonthChange={(value) => updateProjectDateField(project.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateProjectDateField(project.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateProjectDateField(project.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateProjectDateField(project.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateProjectDateField(project.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={project.description}
                        onValueChange={(value) => updateProjectField(project.id, { description: value })}
                        className="h-32 w-full resize-y rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('projects.descriptionPlaceholder')}
                        toolbarLabel={t('projects.descriptionToolbarLabel')}
                      />

                      <input
                        value={getProjectTechnologies(project).join(', ')}
                        onChange={(e) => updateProjectTechnologies(project.id, e.target.value)}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('projects.technologiesPlaceholder')}
                      />

                      <input
                        value={project.url || ''}
                        onChange={(e) => updateProjectField(project.id, { url: e.target.value })}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('projects.urlPlaceholder')}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-(--foreground)">{t('education.heading')}</h2>
                  <p className="mt-1 text-sm text-(--muted)">{t('education.description')}</p>
                </div>
                <button onClick={handleAddEducation} className="text-(--foreground) text-sm font-medium border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{t('education.addInstitution')}</button>
              </div>

              {resumeData.education.length === 0 ? (
                <div className="rounded-none border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  {t('education.emptyState')}
                </div>
              ) : (
                resumeData.education.map((entry, index) => (
                  <div key={entry.id} className="bg-(--surface) border border-(--border) rounded-none p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">{t('education.entryLabel', { index: index + 1 })}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteEducation(entry.id)}
                          className="text-(--muted) hover:text-(--foreground) p-1 transition-colors duration-150 ease-out"
                          aria-label={t('education.deleteAriaLabel')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={entry.institution}
                        onChange={(e) => updateEducationField(entry.id, 'institution', e.target.value)}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('education.institutionPlaceholder')}
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={entry.degree || ''}
                          onChange={(e) => updateEducationField(entry.id, 'degree', e.target.value)}
                          className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder={t('education.degreePlaceholder')}
                        />
                        <input
                          value={entry.field || ''}
                          onChange={(e) => updateEducationField(entry.id, 'field', e.target.value)}
                          className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder={t('education.fieldPlaceholder')}
                        />
                      </div>

                      <input
                        value={entry.location || ''}
                        onChange={(e) => updateEducationField(entry.id, 'location', e.target.value)}
                        className="w-full rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('education.locationPlaceholder')}
                      />

                      <MonthYearRangeField
                        monthLabels={MONTH_LABELS}
                        startMonth={entry.startMonth}
                        startYear={entry.startYear}
                        endMonth={entry.endMonth}
                        endYear={entry.endYear}
                        isCurrent={entry.isCurrent ?? false}
                        onStartMonthChange={(value) => updateEducationDateField(entry.id, 'startMonth', value)}
                        onStartYearChange={(value) => updateEducationDateField(entry.id, 'startYear', value)}
                        onEndMonthChange={(value) => updateEducationDateField(entry.id, 'endMonth', value)}
                        onEndYearChange={(value) => updateEducationDateField(entry.id, 'endYear', value)}
                        onIsCurrentChange={(value) => updateEducationDateField(entry.id, 'isCurrent', value)}
                      />

                      <RichTextarea
                        value={entry.description || ''}
                        onValueChange={(value) => updateEducationField(entry.id, 'description', value)}
                        className="h-24 w-full resize-y rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={t('education.detailsPlaceholder')}
                        toolbarLabel={t('education.descriptionToolbarLabel')}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {['skills', 'certifications', 'sections'].includes(activeTab) ? (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-(--foreground)">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="text-(--foreground) text-sm font-medium border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{t('sections.addSection')}</button>
              </div>

              {visibleDynamicSections.length === 0 ? (
                <div className="rounded-none border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  {t('sections.emptyState')}
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
        
        <div className="shrink-0 p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4" suppressHydrationWarning>
          <button
            onClick={() => void persistResume()}
            disabled={isLoading || isImportingPdf || isExportingPdf || saveStatus === 'saving'}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-none font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {t('actions.save')}
          </button>
          <button
            onClick={exportAsLatexPdf}
            disabled={isExportingPdf || isImportingPdf}
            className={`flex-1 disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants('primary', 'md')}`}
          >
            <Download className="w-4 h-4" /> {isExportingPdf ? t('actions.exporting') : t('actions.exportPdf')}
          </button>
        </div>
      </div>

      {/* Live Preview Pane */}
      <div className="grow min-w-0 bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative print:p-0 print:block print:bg-white print:h-auto" suppressHydrationWarning>
        {/* Mock A4 Paper Preview */}
        <div className="h-full w-full max-w-230 bg-white border border-(--border) mx-auto overflow-y-auto print:border-0 print:w-full print:max-w-none print:overflow-visible print:h-auto">
          <HarvardTemplate data={resumeData} />
        </div>
        <div className="absolute top-3 right-4 text-xs text-(--muted) bg-(--surface) border border-(--border) px-2 py-1 print:hidden" suppressHydrationWarning>
          {saveStatus === 'saving' ? t('status.saving') : saveStatus === 'saved' ? t('status.saved') : saveStatus === 'error' ? t('status.saveFailed') : ''}
        </div>
      </div>

      <AddContentModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddSection}
      />

      <Modal
        open={isTailorModalOpen}
        onClose={() => setIsTailorModalOpen(false)}
        title={t('tailor.modalTitle')}
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsTailorModalOpen(false)}
              className="rounded-none border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              {t('actions.cancel')}
            </button>
            <FeatureButton
              feature="jds"
              onClick={handleTailorResume}
              disabled={isTailoring}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              <Sparkles className="h-4 w-4" />
              {isTailoring ? t('tailor.tailoringInProgress') : t('tailor.applyTailoring')}
            </FeatureButton>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">{t('tailor.modalDescription')}</p>

        <textarea
          value={tailorJobDescription}
          onChange={(e) => setTailorJobDescription(e.target.value)}
          className="mt-4 h-52 w-full resize-none rounded-sm border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
          placeholder={t('tailor.jobDescriptionPlaceholder')}
        />
      </Modal>

      {showBeforeAfterModal && fixPatches.length > 0 && (
        <BeforeAfterModal patches={fixPatches} onClose={() => setShowBeforeAfterModal(false)} />
      )}

      {showClaimConfirmModal && pendingClaimPatches.length > 0 && (
        <BeforeAfterModal
          patches={pendingClaimPatches}
          onClose={() => {
            setShowClaimConfirmModal(false)
            setPendingClaimPatches([])
          }}
          onConfirm={applyConfirmedClaimPatches}
        />
      )}

      <Modal
        open={showUploadWarning}
        onClose={cancelUpload}
        title={t('upload.warningTitle')}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={cancelUpload}
              className="rounded-none border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={finalizeUpload}
              disabled={isImportingPdf}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              {isImportingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t('upload.uploading')}
                </>
              ) : (
                t('upload.gotItContinue')
              )}
            </button>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">
          {t('upload.warningBody')}
        </p>
      </Modal>

      <Modal
        open={showImportLimitModal}
        onClose={closeImportLimitModal}
        title={t('upload.limitReachedTitle')}
        maxWidth="md"
        footer={
          <button onClick={closeImportLimitModal} className={buttonVariants('primary', 'md')}>
            {t('upload.limitReachedGotIt')}
          </button>
        }
      >
        <p className="text-sm text-(--muted)">{t('upload.limitReachedBody')}</p>
      </Modal>

      {isImportingPdf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-none border border-(--border) bg-(--surface) p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-(--accent)" />
              <div>
                <p className="text-sm font-semibold text-(--foreground)">{t('upload.importingOverlayTitle')}</p>
                <p className="text-xs text-(--muted)">{t('upload.importingOverlayBody')}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <UpgradeBanner
        open={showUpgradeModal}
        message={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}



