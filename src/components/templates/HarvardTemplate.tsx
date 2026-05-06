import type { ResumeTemplateData, ResumeDynamicSection } from './types'

type HarvardTemplateProps = {
  data: ResumeTemplateData
}

function normalizeContactText(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '')
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

export function HarvardTemplate({ data }: HarvardTemplateProps) {
  const educationSections = (data.dynamicSections || []).filter((section) => section.type === 'education')
  const nonEducationSections = (data.dynamicSections || []).filter((section) => section.type !== 'education')

  const contactItems = [
    data.personal.email ? { label: 'Email', value: data.personal.email, href: `mailto:${data.personal.email}` } : null,
    data.personal.phone ? { label: 'Phone', value: data.personal.phone, href: `tel:${data.personal.phone.replace(/[^+\d]/g, '')}` } : null,
    data.personal.location ? { label: 'Location', value: data.personal.location, href: null } : null,
    data.personal.linkedin ? { label: 'LinkedIn', value: normalizeContactText(data.personal.linkedin), href: data.personal.linkedin } : null,
    data.personal.github ? { label: 'GitHub', value: normalizeContactText(data.personal.github), href: data.personal.github } : null,
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

      {educationSections.length > 0 && (
        <section className="mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider border-b border-gray-200 pb-1 mb-3">Education</h3>
          {educationSections.map((section) => (
            <EducationSection key={section.id} section={section} />
          ))}
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
