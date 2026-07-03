"use client"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, User, Briefcase, GraduationCap, Code, Cpu, Save, Download, Trash2, FileText, Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { TemplateSwitcher } from '@/components/builder/TemplateSwitcher'
import { HarvardTemplate } from '@/components/templates/HarvardTemplate'
import { AddContentModal, type AddableSection } from '@/components/builder/AddContentModal'
import { SectionPanel } from '@/components/builder/SectionPanel'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'
import { MonthYearRangeField } from '@/components/ui/MonthYearRangeField'
import { RichTextarea } from '@/components/ui/RichTextarea'
import { FeatureButton } from '@/components/FeatureButton'
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
const MAX_FILES_ERROR_MESSAGE = 'You can upload a maximum of 3 PDF/DOCX imports per CV slot.'
const INVALID_FILE_ERROR_MESSAGE = 'Only .pdf and .docx files are allowed.'
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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showUploadWarning, setShowUploadWarning] = useState(false)
  const [showImportLimitModal, setShowImportLimitModal] = useState(false)
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null)
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
  const creationSourceRef = useRef<'import' | 'scratch'>('scratch')
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
              template: normalizeTemplate() || prev.template,
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
          ? `AI applied ${count} improvement${count === 1 ? '' : 's'} to your resume.`
          : 'Auto-fix complete — no changes needed.'
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

    // `derivedTitle` falls back to 'Untitled Resume' whenever firstName/lastName
    // are empty (e.g. a PDF-imported or manually-titled resume whose structured
    // personal fields were never filled in). Only send `title` on updates when
    // it's a real, name-derived value -- otherwise omit it from the PATCH body
    // so the existing DB title (curated or imported) is left untouched instead
    // of being silently overwritten back to 'Untitled Resume' on every autosave.
    const hasDerivedName = derivedTitle !== 'Untitled Resume'
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
      body: JSON.stringify(hasDerivedName ? payload : { data: resumeData }),
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
      setUploadError(INVALID_FILE_ERROR_MESSAGE)
      return false
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File must be under 5 MB.')
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
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setPendingUploadFile(null)
    } finally {
      setIsImportingPdf(false)
    }
  }

  const cancelUpload = () => {
    setShowUploadWarning(false)
    setPendingUploadFile(null)
  }

  const closeImportLimitModal = () => {
    setShowImportLimitModal(false)
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
        className="w-full min-h-0 bg-(--surface) border-r border-(--border) flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden z-10 shadow-2xl lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden"
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
              className={`flex min-w-35 items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id
                ? 'bg-(--accent-muted) text-(--accent) border border-(--accent)/30'
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
              className="flex-1 rounded-lg border border-(--accent)/30 bg-(--accent-muted) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--accent)/20"
            >
              + Add Section
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
              className="flex-1 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--foreground) hover:bg-(--surface-elevated) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImportingPdf
                ? 'Importing...'
                : `Import PDF/DOCX (${getPdfImportCount(resumeData)}/${MAX_PDF_IMPORTS_PER_RESUME})`}
            </button>
            <FeatureButton
              feature="jds"
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm font-semibold text-(--accent) hover:bg-(--surface-elevated)"
            >
              AI Tailor
            </FeatureButton>
          </div>
        </div>

        {fixBanner ? (
          <div className="shrink-0 mx-4 mt-3 rounded-xl border border-(--accent)/40 bg-(--accent-muted) px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-sm text-(--accent-strong) font-medium">{fixBanner}</p>
            <button
              onClick={() => setFixBanner(null)}
              className="text-(--muted) hover:text-(--foreground) text-xs shrink-0"
            >
              x
            </button>
          </div>
        ) : null}

        {uploadError ? (
          <div className="shrink-0 mx-4 mt-3 flex gap-3 rounded-xl border border-red-800/60 bg-red-900/20 px-4 py-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </div>
        ) : null}

        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar builder-panel-scrollbar"
          suppressHydrationWarning
          style={{ scrollbarGutter: 'stable both-edges' }}
        >
          {activeTab === 'personal' && (
            <div className="space-y-4" suppressHydrationWarning>
              <h2 className="text-xl font-bold text-(--foreground) mb-6">Personal details</h2>
              {/* Form fields would be controlled components, omitted for brevity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">First Name</label>
                  <input type="text" value={resumeData.personal.firstName} onChange={(e) => updatePersonalField('firstName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Last Name</label>
                  <input type="text" value={resumeData.personal.lastName} onChange={(e) => updatePersonalField('lastName', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">Job Title</label>
                <input type="text" value={resumeData.personal.title} onChange={(e) => updatePersonalField('title', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Email</label>
                  <input type="email" value={resumeData.personal.email} onChange={(e) => updatePersonalField('email', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Phone</label>
                  <input type="text" value={resumeData.personal.phone} onChange={(e) => updatePersonalField('phone', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-(--muted)">Location</label>
                <input type="text" value={resumeData.personal.location || ''} onChange={(e) => updatePersonalField('location', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="Cluj-Napoca, Romania" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium text-(--muted)">Professional Summary</label>
                  <button
                    onClick={() => setIsSummaryGeneratorOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-(--accent)/40 bg-(--accent-muted) px-2.5 py-1 text-xs font-semibold text-(--accent-strong) hover:bg-(--accent)/20"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate with AI
                  </button>
                </div>

                <RichTextarea
                  value={resumeData.personal.summary}
                  onValueChange={(value) => updatePersonalField('summary', value)}
                  className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors h-28 resize-none"
                  placeholder="Professional summary"
                  toolbarLabel="Summary formatting"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">LinkedIn URL</label>
                  <input type="text" value={resumeData.personal.linkedin || ''} onChange={(e) => updatePersonalField('linkedin', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://linkedin.com/in/yourname" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">GitHub URL</label>
                  <input type="text" value={resumeData.personal.github || ''} onChange={(e) => updatePersonalField('github', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://github.com/yourusername" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-(--muted)">Website / Portfolio</label>
                  <input type="text" value={resumeData.personal.website || ''} onChange={(e) => updatePersonalField('website', e.target.value)} className="w-full bg-(--surface) border border-(--border) rounded-lg px-4 py-2 text-(--foreground) focus:outline-none focus:border-(--accent-strong) transition-colors" placeholder="https://yourdomain.com" />
                </div>

                {isSummaryGeneratorOpen ? (
                  <div className="rounded-xl border border-(--border) bg-(--background) p-3 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSummaryGenerationMode('resume')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'resume'
                            ? 'border border-(--accent)/40 bg-(--accent)/15 text-(--accent-strong)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        Based on my resume
                      </button>
                      <button
                        onClick={() => setSummaryGenerationMode('scratch')}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          summaryGenerationMode === 'scratch'
                            ? 'border border-(--accent)/40 bg-(--accent)/15 text-(--accent-strong)'
                            : 'border border-(--border) bg-(--surface) text-(--muted) hover:text-(--foreground)'
                        }`}
                      >
                        Write from scratch
                      </button>
                    </div>

                    {summaryGenerationMode === 'scratch' ? (
                      <textarea
                        value={summaryRoleDescription}
                        onChange={(e) => setSummaryRoleDescription(e.target.value)}
                        className="h-24 w-full resize-none rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Describe your target role, level, and focus areas..."
                      />
                    ) : null}

                    {isGeneratingSummary ? (
                      <div className="rounded-lg border border-(--border) bg-(--surface)">
                        <AILoadingState stage="generating" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setIsSummaryGeneratorOpen(false)}
                          className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground)"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                          className={`rounded-md text-xs ${buttonVariants('primary', 'sm')}`}
                        >
                          Generate summary
                        </button>
                      </div>
                    )}

                    {summaryGenerationError ? (
                      <p className="text-xs text-red-400">{summaryGenerationError}</p>
                    ) : null}

                    <AnimatePresence>
                      {generatedSummaryDraft ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="rounded-lg border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-(--accent-strong)">AI Draft</p>
                          <p className="text-sm text-(--foreground)/95 leading-relaxed">{generatedSummaryDraft}</p>
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => void handleGenerateSummary(summaryGenerationMode)}
                              disabled={isGeneratingSummary}
                              className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Regenerate
                            </button>
                            <button
                              onClick={() => updatePersonalField('summary', generatedSummaryDraft)}
                              className="rounded-md bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--background) hover:bg-(--accent)"
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
                <h2 className="text-xl font-bold text-(--foreground)">Work Experience</h2>
                <button onClick={handleAddRole} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Role</button>
              </div>

              {resumeData.experience.map((exp, expIndex) => {
                const experienceBullets = getExperienceBullets(exp)
                const globalBulletOffset = resumeData.experience
                  .slice(0, expIndex)
                  .reduce((sum, e) => sum + getExperienceBullets(e).length, 0)

                return (
                 <div key={exp.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-(--muted)">Experience Entry</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-(--accent-strong) hover:text-(--accent) p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-(--accent-strong) border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
                       </button>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input
                       value={exp.title}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'title', e.target.value)}
                       className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder="Role title"
                     />
                     <input
                       value={exp.company}
                       onChange={(e) => updateExperienceMetaField(exp.id, 'company', e.target.value)}
                       className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                       placeholder="Company"
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
                         <p className="text-xs uppercase tracking-wide text-(--muted)">Impact Bullets</p>
                         <button
                           onClick={() => addExperienceBullet(exp.id)}
                           className="text-xs font-medium text-(--accent) hover:text-(--accent-strong)"
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
                             <span className="pt-9 text-(--accent)">•</span>
                             <RichTextarea
                               ref={(node) => {
                                 bulletFieldRefs.current[draftKey] = node
                               }}
                               data-bullet-global-index={globalIdx}
                               value={bullet}
                               onValueChange={(value) => updateExperienceBulletField(exp.id, bulletIndex, value)}
                               className={`h-20 w-full resize-none rounded-lg border bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:outline-none transition-colors ${
                                 isHighlighted
                                   ? 'border-(--accent-strong) ring-2 ring-(--accent-strong)/40 focus:border-(--accent-strong)'
                                   : 'border-(--border) focus:border-(--accent-strong)'
                               }`}
                               placeholder="Describe measurable impact"
                               toolbarLabel="Bullet formatting"
                             />
                             <div className="flex flex-col gap-1 pt-7">
                               <button
                                 onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                 disabled={Boolean(draftState?.isLoading)}
                                 className="rounded-md border border-(--accent)/40 px-2 py-1 text-[11px] text-(--accent) hover:bg-(--accent-muted) disabled:cursor-not-allowed disabled:opacity-70"
                               >
                                 {draftState?.isLoading ? 'AI...' : 'AI Draft'}
                               </button>
                               <button
                                 onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                                 disabled={experienceBullets.length === 1}
                                 className="rounded-md border border-(--accent-strong)/35 px-2 py-1 text-[11px] text-(--accent-strong) hover:bg-(--accent)/12 disabled:cursor-not-allowed disabled:opacity-40"
                               >
                                 Del
                               </button>
                             </div>
                           </motion.div>

                           <p className="pl-5 text-[11px] text-amber-300/90">
                             AI Draft and Regenerate each consume 1 bullet rewrite credit.
                           </p>

                           {draftState?.isLoading ? (
                             <div className="ml-5 rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-xs text-(--muted)">
                               Generating AI draft...
                             </div>
                           ) : null}

                           {draftState?.error ? (
                             <p className="ml-5 text-xs text-red-400 whitespace-pre-line">{draftState.error}</p>
                           ) : null}

                           <AnimatePresence>
                             {hasDraft ? (
                               <motion.div
                                 initial={{ opacity: 0, y: 8 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 exit={{ opacity: 0, y: 8 }}
                                 transition={{ duration: 0.2, ease: 'easeOut' }}
                                 className="ml-5 rounded-lg border border-(--accent)/30 bg-(--accent)/8 p-3 space-y-2"
                               >
                                 <div className="flex items-center justify-between gap-2">
                                   <p className="text-[11px] font-semibold uppercase tracking-wide text-(--accent-strong)">AI Draft</p>
                                   <p className="text-[11px] text-amber-300/90">Regenerate uses 1 credit</p>
                                 </div>
                                 <p className="text-sm text-(--foreground)/95 leading-relaxed">{draftState?.draft}</p>
                                 <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => void handleGenerateBulletDraft(exp.id, bulletIndex)}
                                    disabled={Boolean(draftState?.isLoading)}
                                    className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--muted) hover:text-(--foreground) disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                     Regenerate
                                   </button>
                                   <button
                                     onClick={() => handleAcceptBulletDraft(exp.id, bulletIndex)}
                                     className="rounded-md bg-(--accent-strong) px-3 py-1.5 text-xs font-semibold text-(--background) hover:bg-(--accent)"
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

          {activeTab === 'projects' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-(--foreground)">Projects</h2>
                  <p className="mt-1 text-sm text-(--muted)">Manage your imported and manual projects here. These are rendered separately from custom sections.</p>
                </div>
                <button onClick={handleAddProject} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Project</button>
              </div>

              {resumeData.projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  No projects yet. Add one to keep it separate from custom sections.
                </div>
              ) : (
                resumeData.projects.map((project, index) => (
                  <div key={project.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">Project {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-(--accent-strong) hover:text-(--accent) p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={project.name}
                        onChange={(e) => updateProjectField(project.id, { name: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Project name"
                      />

                      <input
                        value={project.role || ''}
                        onChange={(e) => updateProjectField(project.id, { role: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Role / Title (e.g. Solo Founder, Lead Developer)"
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
                        className="h-32 w-full resize-y rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder={`Describe what you built, shipped, or learned. Tip: each line becomes its own bullet, e.g.:\n• Built X\n• Deployed Y\n• Reduced cost by 40%`}
                        toolbarLabel="Project description formatting"
                      />

                      <input
                        value={getProjectTechnologies(project).join(', ')}
                        onChange={(e) => updateProjectTechnologies(project.id, e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Technologies separated by commas (React, Node.js, AWS)"
                      />

                      <input
                        value={project.url || ''}
                        onChange={(e) => updateProjectField(project.id, { url: e.target.value })}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Project URL or GitHub link"
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
                  <h2 className="text-xl font-bold text-(--foreground)">Education</h2>
                  <p className="mt-1 text-sm text-(--muted)">Add each institution as a separate entry. Use the date pickers for graduation timelines.</p>
                </div>
                <button onClick={handleAddEducation} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Institution</button>
              </div>

              {resumeData.education.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
                  No education entries yet. Click + Add Institution to add your first one.
                </div>
              ) : (
                resumeData.education.map((entry, index) => (
                  <div key={entry.id} className="bg-(--surface) border border-(--border) rounded-xl p-4 hover:border-(--accent-strong)/60 transition-colors" suppressHydrationWarning>
                    <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                      <p className="text-xs uppercase tracking-wide text-(--muted)">Institution {index + 1}</p>
                      <div className="flex gap-2" suppressHydrationWarning>
                        <button
                          onClick={() => deleteEducation(entry.id)}
                          className="text-(--accent-strong) hover:text-(--accent) p-1"
                          aria-label="Delete education entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        value={entry.institution}
                        onChange={(e) => updateEducationField(entry.id, 'institution', e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Institution (e.g. Stanford University)"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={entry.degree || ''}
                          onChange={(e) => updateEducationField(entry.id, 'degree', e.target.value)}
                          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder="Degree (e.g. B.Sc. in Computer Science)"
                        />
                        <input
                          value={entry.field || ''}
                          onChange={(e) => updateEducationField(entry.id, 'field', e.target.value)}
                          className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                          placeholder="Field of study (optional)"
                        />
                      </div>

                      <input
                        value={entry.location || ''}
                        onChange={(e) => updateEducationField(entry.id, 'location', e.target.value)}
                        className="w-full rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Location (optional, e.g. Stanford, CA)"
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
                        className="h-24 w-full resize-y rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
                        placeholder="Optional details (GPA, honors, relevant coursework, thesis, ...)"
                        toolbarLabel="Education description formatting"
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
                <h2 className="text-xl font-bold text-(--foreground)">{tabs.find((t) => t.id === activeTab)?.label}</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="text-(--accent) text-sm font-medium hover:text-(--accent-strong)">+ Add Section</button>
              </div>

              {visibleDynamicSections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm text-(--muted)">
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
        
        <div className="shrink-0 p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4" suppressHydrationWarning>
          <button
            onClick={() => void persistResume()}
            disabled={isLoading || isImportingPdf || isExportingPdf || saveStatus === 'saving'}
            className="flex-1 bg-(--surface) border border-(--border) hover:bg-(--surface-elevated) text-(--foreground) px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={exportAsLatexPdf}
            disabled={isExportingPdf || isImportingPdf}
            className={`flex-1 shadow-lg shadow-(--accent)/20 disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants('primary', 'md')}`}
          >
            <Download className="w-4 h-4" /> {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Live Preview Pane */}
      <div className="grow min-w-0 bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative print:p-0 print:block print:bg-white print:h-auto" suppressHydrationWarning>
        {/* Mock A4 Paper Preview */}
        <div className="h-full w-full max-w-230 bg-white rounded-lg shadow-2xl mx-auto overflow-y-auto print:shadow-none print:w-full print:max-w-none print:overflow-visible print:h-auto">
          <HarvardTemplate data={resumeData} />
        </div>
        <div className="absolute top-3 right-4 text-xs text-(--muted) bg-black/40 px-2 py-1 rounded print:hidden" suppressHydrationWarning>
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save failed' : ''}
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
        title="AI Resume Tailor"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsTailorModalOpen(false)}
              className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              Cancel
            </button>
            <FeatureButton
              feature="jds"
              onClick={handleTailorResume}
              disabled={isTailoring}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              <Sparkles className="h-4 w-4" />
              {isTailoring ? 'Tailoring...' : 'Apply Tailoring'}
            </FeatureButton>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">Paste a job description and tailor your resume bullets for this role.</p>

        <textarea
          value={tailorJobDescription}
          onChange={(e) => setTailorJobDescription(e.target.value)}
          className="mt-4 h-52 w-full resize-none rounded-lg border border-(--border) bg-(--background) px-3 py-2 text-sm text-(--foreground) focus:border-(--accent-strong) focus:outline-none"
          placeholder="Paste job description here..."
        />
      </Modal>

      {showBeforeAfterModal && fixPatches.length > 0 && (
        <BeforeAfterModal patches={fixPatches} onClose={() => setShowBeforeAfterModal(false)} />
      )}

      <Modal
        open={showUploadWarning}
        onClose={cancelUpload}
        title="Before you upload"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={cancelUpload}
              className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
            >
              Cancel
            </button>
            <button
              onClick={finalizeUpload}
              disabled={isImportingPdf}
              className={`inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70 ${buttonVariants('primary', 'md')}`}
            >
              {isImportingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                'Got it, continue'
              )}
            </button>
          </div>
        }
      >
        <p className="text-sm text-(--muted)">
          For best results, upload a digitally generated PDF or DOCX file. Scanned documents or photos of CVs may produce incomplete results.
        </p>
      </Modal>

      <Modal
        open={showImportLimitModal}
        onClose={closeImportLimitModal}
        title="Import limit reached"
        maxWidth="md"
        footer={
          <button onClick={closeImportLimitModal} className={buttonVariants('primary', 'md')}>
            Got it
          </button>
        }
      >
        <p className="text-sm text-(--muted)">{MAX_FILES_ERROR_MESSAGE}</p>
      </Modal>

      {isImportingPdf ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-2xl border border-(--border) bg-(--surface) p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-(--accent-strong)" />
              <div>
                <p className="text-sm font-semibold text-(--foreground)">Importing PDF/DOCX</p>
                <p className="text-xs text-(--muted)">Parsing your resume. This can take a moment.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}



