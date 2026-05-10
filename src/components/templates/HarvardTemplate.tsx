import type { ResumeTemplateData, ResumeDynamicSection, ResumeEducation } from './types'

type HarvardTemplateProps = {
  data: ResumeTemplateData
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatEducationPeriod(entry: ResumeEducation): string {
  const startLabel = entry.startYear
    ? entry.startMonth
      ? `${MONTH_LABELS[entry.startMonth - 1]} ${entry.startYear}`
      : `${entry.startYear}`
    : ''
  const endLabel = entry.isCurrent
    ? 'Present'
    : entry.endYear
      ? entry.endMonth
        ? `${MONTH_LABELS[entry.endMonth - 1]} ${entry.endYear}`
        : `${entry.endYear}`
      : ''

  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  if (startLabel) return startLabel
  if (endLabel) return endLabel
  return ''
}

function buildEducationDegreeLine(entry: ResumeEducation): string {
  return [entry.degree, entry.field].map((part) => (part || '').trim()).filter(Boolean).join(', ')
}

function normalizeContactText(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '')
}

// LinkedIn / GitHub / website fields are free-text inputs in the builder, so
// users frequently leave the placeholder copy in place ("LinkedIn Link",
// "https://github.com/yourusername"). Render these as plain text — never as
// hyperlinks — so the exported PDF never points at a broken URL.
const PLACEHOLDER_TOKENS = /yourusername|placeholder|example\.com/i

function looksLikeUrl(value: string | undefined | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (PLACEHOLDER_TOKENS.test(trimmed)) return false
  // Accept both fully-qualified URLs and bare domains like "linkedin.com/in/foo".
  if (/^https?:\/\//i.test(trimmed)) return true
  return /^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(trimmed)
}

function normalizeHref(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function resolveBullets(exp: { bullets?: string[]; description: string }) {
  const bullets = (exp.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets
  return exp.description?.trim() ? [exp.description.trim()] : []
}

function resolveProjectBullets(project: { bullets?: string[]; description?: string }): string[] {
  // Prefer structured bullets, then fall back to splitting the description on newlines so
  // imported descriptions render as discrete line items instead of one wall of text.
  const bullets = (project.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets

  const description = (project.description || '').trim()
  if (!description) return []

  const byLine = description.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean)
  if (byLine.length > 0) return byLine

  return [description]
}

type EduEntry = {
  institution: string
  degreeLines: string[]
}

function parseEducationEntries(content: string): EduEntry[] {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return { institution: '', degreeLines: [] }

    const institution = lines[0]
    const degreeLines = lines.slice(1)
    return { institution, degreeLines }
  })
}

function EducationSection({ section }: { section: ResumeDynamicSection }) {
  const entries = parseEducationEntries(section.content)
  if (entries.length === 0) {
    return <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
  }
  return (
    <>
      {entries.map((entry, i) => (
        <div key={i} className={i > 0 ? 'mt-4' : ''}>
          <div className="flex justify-between items-baseline">
            <p className="font-bold text-gray-900">{entry.institution}</p>
          </div>
          {entry.degreeLines.map((line, j) => (
            <p key={j} className="text-gray-700 italic">{line}</p>
          ))}
        </div>
      ))}
    </>
  )
}

function StructuredEducationSection({ entries }: { entries: ResumeEducation[] }) {
  return (
    <>
      {entries.map((entry, i) => {
        const period = formatEducationPeriod(entry)
        const degreeLine = buildEducationDegreeLine(entry)
        const description = (entry.description || '').trim()
        return (
          <div key={entry.id} className={i > 0 ? 'mt-4' : ''}>
            <div className="flex justify-between items-baseline mb-1">
              <p className="font-bold text-gray-900">{entry.institution}</p>
              {period ? <span className="text-sm text-gray-600">{period}</span> : null}
            </div>
            {degreeLine ? <p className="text-gray-700 italic">{degreeLine}</p> : null}
            {entry.location ? <p className="text-sm text-gray-600">{entry.location}</p> : null}
            {description ? (
              <p className="text-gray-800 leading-relaxed mt-1 whitespace-pre-wrap">{description}</p>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export function HarvardTemplate({ data }: HarvardTemplateProps) {
  const structuredEducation = (data.education || []).filter((entry) => (entry.institution || '').trim())
  // Render legacy text-based education sections only when there is no structured data,
  // so re-imported CVs do not display Education twice.
  const educationSections = structuredEducation.length === 0
    ? (data.dynamicSections || []).filter((section) => section.type === 'education')
    : []
  const nonEducationSections = (data.dynamicSections || []).filter((section) => section.type !== 'education')

  const linkedinHref = looksLikeUrl(data.personal.linkedin) ? normalizeHref(data.personal.linkedin!) : null
  const githubHref = looksLikeUrl(data.personal.github) ? normalizeHref(data.personal.github!) : null
  const websiteHref = looksLikeUrl(data.personal.website) ? normalizeHref(data.personal.website!) : null

  const contactItems = [
    data.personal.email ? { label: 'Email', value: data.personal.email, href: `mailto:${data.personal.email}` } : null,
    data.personal.phone ? { label: 'Phone', value: data.personal.phone, href: `tel:${data.personal.phone.replace(/[^+\d]/g, '')}` } : null,
    data.personal.location ? { label: 'Location', value: data.personal.location, href: null } : null,
    linkedinHref ? { label: 'LinkedIn', value: normalizeContactText(linkedinHref), href: linkedinHref } : null,
    githubHref ? { label: 'GitHub', value: normalizeContactText(githubHref), href: githubHref } : null,
    websiteHref ? { label: 'Website', value: normalizeContactText(websiteHref), href: websiteHref } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string | null }>

  return (
    <div className="p-12 text-black font-serif h-full">
      <div className="border-b-2 border-gray-300 pb-6 mb-6 text-center">
        <h1 className="text-4xl font-bold uppercase tracking-[0.2em] mb-2">{data.personal.firstName} {data.personal.lastName}</h1>
        <h2 className="text-xl text-gray-700 mb-4 uppercase tracking-wide">{data.personal.title}</h2>
        <p className="text-sm text-gray-600">
          {contactItems.map((item, index) => (
            <span key={item.label}>
              {index > 0 ? ' • ' : ''}
              {item.href ? (
                <a className="hover:underline" href={item.href} target="_blank" rel="noreferrer">
                  {item.value}
                </a>
              ) : (
                <span>{item.value}</span>
              )}
            </span>
          ))}
        </p>
      </div>

      {data.personal.summary && (
        <section className="mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Summary</h3>
          <p className="text-gray-800 leading-relaxed">{data.personal.summary}</p>
        </section>
      )}

      <section className="mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Experience</h3>
        {data.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="font-bold text-gray-900">{exp.title}</h4>
              <span className="text-sm text-gray-600">{exp.period}</span>
            </div>
            <p className="text-gray-700 italic mb-2">{exp.company}</p>
            <ul className="list-disc pl-5 text-gray-800">
              {resolveBullets(exp).map((bullet, index) => (
                <li key={`${exp.id}-bullet-${index}`}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {(data.projects && data.projects.length > 0) && (
        <section className="mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Projects</h3>
          {data.projects.map((project) => {
            const bullets = resolveProjectBullets(project)
            return (
              <div key={project.id} className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-gray-900">{project.name}</h4>
                  {project.period ? <span className="text-sm text-gray-600">{project.period}</span> : null}
                </div>
                {project.role ? <p className="text-gray-700 italic mb-2">{project.role}</p> : null}
                {bullets.length > 0 && (
                  <ul className="list-disc pl-5 text-gray-800 mb-2">
                    {bullets.map((line, i) => (
                      <li key={`${project.id}-bullet-${i}`}>{line}</li>
                    ))}
                  </ul>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Technologies:</strong> {project.technologies.join(', ')}
                  </p>
                )}
                {project.url ? (
                  <p className="text-sm text-gray-600">
                    <a href={project.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {normalizeContactText(project.url)}
                    </a>
                  </p>
                ) : null}
              </div>
            )
          })}
        </section>
      )}

      {(structuredEducation.length > 0 || educationSections.length > 0) && (
        <section className="mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Education</h3>
          {structuredEducation.length > 0 ? (
            <StructuredEducationSection entries={structuredEducation} />
          ) : (
            educationSections.map((section) => (
              <EducationSection key={section.id} section={section} />
            ))
          )}
        </section>
      )}

      {nonEducationSections.map((section) => (
        <section key={section.id} className="mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">{section.title}</h3>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
        </section>
      ))}
    </div>
  )
}
