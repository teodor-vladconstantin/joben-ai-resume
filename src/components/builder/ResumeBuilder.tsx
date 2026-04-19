"use client"
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Award, User, Briefcase, GraduationCap, Code, Cpu, Save, Download, Trash2, FileText, Sparkles } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { TemplateSwitcher } from '@/components/builder/TemplateSwitcher'
import { HarvardTemplate } from '@/components/templates/HarvardTemplate'
import { AddContentModal, type AddableSection } from '@/components/builder/AddContentModal'
import { SectionPanel } from '@/components/builder/SectionPanel'
import { UpgradeModal } from '@/components/ui/UpgradeModal'
import { startProCheckout } from '@/lib/client-billing'
import type { ResumeTemplateData } from '@/components/templates/types'
import { importPdfClientSide } from '@/lib/pdf-import'

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
  const [activeTab, setActiveTab] = useState('experience')
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [isPending] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false)
  const [tailorJobDescription, setTailorJobDescription] = useState('')
  const [tailorType, setTailorType] = useState<'job_specific' | 'general'>('job_specific')
  const [isTailoring, setIsTailoring] = useState(false)
  const [improvingExperienceId, setImprovingExperienceId] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('Upgrade to Pro to unlock this AI feature.')
  const params = useParams<{ id: string }>()
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
    if (isLoading) return
    const handle = setTimeout(() => {
      void persistResume()
    }, 800)

    return () => clearTimeout(handle)
  }, [isLoading, persistResume])

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

  const addExperienceBullet = (experienceId: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) =>
        exp.id === experienceId
          ? {
              ...exp,
              bullets: [...getExperienceBullets(exp), ''],
            }
          : exp
      ),
    }))
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
  }

  const handleDeleteExperience = (experienceId: string) => {
    if (confirm('Are you sure you want to delete this experience entry?')) {
      setResumeData(prevData => ({
        ...prevData,
        experience: prevData.experience.filter(exp => exp.id !== experienceId),
      }))
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
    try {
      const data = await importPdfClientSide(file)
      handleOnboardingImport(data)
      setActiveTab('personal')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF import failed. Please try again.')
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
          optimizationType: tailorType,
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

  const handleImproveExperienceBullet = async (experienceId: string, bulletIndex = 0) => {
    const target = resumeData.experience.find((item) => item.id === experienceId)
    if (!target) return

    const targetBullets = getExperienceBullets(target)
    const targetBullet = targetBullets[bulletIndex] || ''

    if (!targetBullet.trim()) {
      alert('Add bullet text before using AI Improve.')
      return
    }

    setImprovingExperienceId(experienceId)

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
      }

      if (!response.ok || !payload.bullet) {
        if (payload.showUpgrade) {
          setUpgradeMessage(payload.error || 'Bullet rewrite is available on Pro.')
          setShowUpgradeModal(true)
          setImprovingExperienceId(null)
          return
        }
        alert(payload.error || 'Could not improve bullet.')
        setImprovingExperienceId(null)
        return
      }

      setResumeData((prev) => ({
        ...prev,
        experience: prev.experience.map((exp) => {
          if (exp.id !== experienceId) return exp

          const nextBullets = [...getExperienceBullets(exp)]
          const safeIndex = Math.max(0, Math.min(bulletIndex, nextBullets.length - 1))
          nextBullets[safeIndex] = payload.bullet || nextBullets[safeIndex]
          const summaryBullet = nextBullets.find((bullet) => bullet.trim().length > 0) || nextBullets[0] || ''

          return {
            ...exp,
            bullets: nextBullets,
            description: summaryBullet,
          }
        }),
      }))
    } catch (error) {
      alert(`Improve bullet failed: ${(error as Error).message}`)
    }

    setImprovingExperienceId(null)
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col lg:min-w-315 lg:flex-row print:block" suppressHydrationWarning>
      {/* Editor Sidebar */}
      <div className="w-full min-h-0 bg-[#0A0F0D] border-r border-white/10 flex flex-col h-full z-10 shadow-2xl lg:w-115 lg:min-w-115 lg:max-w-115 lg:shrink-0 print:hidden" suppressHydrationWarning>
        <input
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
              onClick={() => document.getElementById('pdf-import-input')?.click()}
              className="flex-1 rounded-lg border border-white/10 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-white/88 hover:bg-white/5"
            >
              Import from PDF
            </button>
            <button
              onClick={() => setIsTailorModalOpen(true)}
              className="flex-1 rounded-lg border border-white/12 bg-[#0A0F0D] px-3 py-2 text-sm font-semibold text-[#0A9548] hover:bg-[#0A0F0D]"
            >
              AI Tailor
            </button>
          </div>
        </div>
        
        <div
          className="min-h-0 grow p-6 overflow-y-auto custom-scrollbar"
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
                <label className="text-sm font-medium text-[#FFFFFF]/82">Professional Summary</label>
                <textarea value={resumeData.personal.summary} onChange={(e) => updatePersonalField('summary', e.target.value)} className="w-full bg-[#0A0F0D] border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#16DB65] transition-colors h-28 resize-none" placeholder="Professional summary" />
              </div>
            </div>
          )}
          
          {activeTab === 'experience' && (
            <div className="space-y-4" suppressHydrationWarning>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Work Experience</h2>
                <button onClick={handleAddRole} className="text-[#0A9548] text-sm font-medium hover:text-[#16DB65]">+ Add Role</button>
              </div>
              
              {resumeData.experience.map((exp) => {
                const experienceBullets = getExperienceBullets(exp)

                return (
                 <div key={exp.id} className="bg-[#0A0F0D] border border-white/10 rounded-xl p-4 hover:border-[#16DB65]/60 transition-colors" suppressHydrationWarning>
                   <div className="flex items-center justify-between gap-2 mb-3" suppressHydrationWarning>
                     <p className="text-xs uppercase tracking-wide text-[#FFFFFF]/82">Experience Entry</p>
                     <div className="flex gap-2" suppressHydrationWarning>
                       <button 
                         onClick={() => handleDeleteExperience(exp.id)}
                         disabled={isPending}
                         className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         {isPending ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
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

                       {experienceBullets.map((bullet, bulletIndex) => (
                         <div key={`${exp.id}-bullet-${bulletIndex}`} className="flex items-start gap-2">
                           <span className="pt-2 text-[#0A9548]">•</span>
                           <textarea
                             value={bullet}
                             onChange={(e) => updateExperienceBulletField(exp.id, bulletIndex, e.target.value)}
                             className="h-20 w-full resize-none rounded-lg border border-white/10 bg-[#020202] px-3 py-2 text-sm text-white focus:border-[#16DB65] focus:outline-none"
                             placeholder="Describe measurable impact"
                           />
                           <div className="flex flex-col gap-1">
                             <button
                               onClick={() => void handleImproveExperienceBullet(exp.id, bulletIndex)}
                               disabled={improvingExperienceId === exp.id}
                               className="rounded-md border border-[#0A9548]/40 px-2 py-1 text-[11px] text-[#0A9548] hover:bg-[#0A9548]/10 disabled:cursor-not-allowed disabled:opacity-70"
                             >
                               AI
                             </button>
                             <button
                               onClick={() => removeExperienceBullet(exp.id, bulletIndex)}
                               disabled={experienceBullets.length === 1}
                               className="rounded-md border border-red-500/40 px-2 py-1 text-[11px] text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                             >
                               Del
                             </button>
                           </div>
                         </div>
                       ))}
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
          <button onClick={exportAsLatexPdf} className="flex-1 bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-4 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-lg shadow-[#0A9548]/20">
            <Download className="w-4 h-4" /> Export PDF
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

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setTailorType('job_specific')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  tailorType === 'job_specific'
                    ? 'border-[#0A9548]/50 bg-[#0A9548]/10 text-[#0A9548]'
                    : 'border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/72'
                }`}
              >
                Job Specific
              </button>
              <button
                onClick={() => setTailorType('general')}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  tailorType === 'general'
                    ? 'border-[#0A9548]/50 bg-[#0A9548]/10 text-[#0A9548]'
                    : 'border-white/10 bg-[#0A0F0D] text-[#FFFFFF]/72'
                }`}
              >
                General Optimization
              </button>
            </div>

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
              <button
                onClick={() => void handleTailorResume()}
                disabled={isTailoring}
                className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-[#0A9548] to-[#04471C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Sparkles className="h-4 w-4" />
                {isTailoring ? 'Tailoring...' : 'Apply Tailoring'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

