import type { ResumeTemplateData, ResumeDynamicSection, ResumeEducation } from './types'
import {
  buildContactItems,
  buildEducationDegreeLine,
  formatEducationPeriod,
  FormattedText,
  normalizeContactText,
  parseEducationEntries,
  resolveBullets,
  resolveProjectBullets,
} from './shared'

// Same accent used by buildModernLatex() in
// src/app/api/resumes/export-latex/route.ts — keep these in sync so the
// exported PDF matches this preview.
const ACCENT = '#1D4ED8'

type ModernTemplateProps = {
  data: ResumeTemplateData
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-bold uppercase tracking-[0.15em] pl-3 mb-3"
      style={{ color: ACCENT, borderLeft: `3px solid ${ACCENT}` }}
    >
      {children}
    </h3>
  )
}

function AccentBulletList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>
}

function AccentBulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-gray-800">
      <span className="mt-[3px] shrink-0" style={{ color: ACCENT }}>
        ▸
      </span>
      <span>{children}</span>
    </li>
  )
}

function EducationSection({ section }: { section: ResumeDynamicSection }) {
  const entries = parseEducationEntries(section.content)
  if (entries.length === 0) {
    return <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
  }
  return (
    <>
      {entries.map((entry, i) => (
        <div key={i} className={i > 0 ? 'mt-3' : ''}>
          <p className="font-semibold text-gray-900">{entry.institution}</p>
          {entry.degreeLines.map((line, j) => (
            <p key={j} className="text-gray-600">{line}</p>
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
          <div key={entry.id} className={i > 0 ? 'mt-3' : ''}>
            <div className="flex justify-between items-baseline">
              <p className="font-semibold text-gray-900">{entry.institution}</p>
              {period ? <span className="text-xs text-gray-500 font-medium">{period}</span> : null}
            </div>
            {degreeLine ? <p className="text-gray-600">{degreeLine}</p> : null}
            {entry.location ? <p className="text-xs text-gray-500">{entry.location}</p> : null}
            {description ? (
              <p className="text-gray-800 leading-relaxed mt-1 whitespace-pre-wrap">
                <FormattedText value={description} idPrefix={`edu-${entry.id}`} />
              </p>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export function ModernTemplate({ data }: ModernTemplateProps) {
  const structuredEducation = (data.education || []).filter((entry) => (entry.institution || '').trim())
  // Render legacy text-based education sections only when there is no structured data,
  // so re-imported CVs do not display Education twice.
  const educationSections = structuredEducation.length === 0
    ? (data.dynamicSections || []).filter((section) => section.type === 'education')
    : []
  const nonEducationSections = (data.dynamicSections || []).filter((section) => section.type !== 'education')

  const contactItems = buildContactItems(data.personal)

  return (
    <div className="p-12 text-gray-900 font-sans h-full">
      <div className="pb-5 mb-7">
        <h1 className="text-4xl font-bold tracking-tight mb-1">
          {data.personal.firstName} {data.personal.lastName}
        </h1>
        {data.personal.title ? (
          <h2 className="text-lg font-medium mb-3" style={{ color: ACCENT }}>
            {data.personal.title}
          </h2>
        ) : null}
        <p className="text-sm text-gray-600 flex flex-wrap gap-x-1">
          {contactItems.map((item, index) => (
            <span key={item.label} className="flex items-center gap-1">
              {index > 0 ? <span style={{ color: ACCENT }}>•</span> : null}
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
        <div className="mt-4 h-[3px] rounded-full" style={{ backgroundColor: ACCENT }} />
      </div>

      {data.personal.summary && (
        <section className="mb-6">
          <SectionHeading>Summary</SectionHeading>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            <FormattedText value={data.personal.summary} idPrefix="summary" />
          </p>
        </section>
      )}

      <section className="mb-6">
        <SectionHeading>Experience</SectionHeading>
        {data.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h4 className="font-semibold text-gray-900">{exp.title}</h4>
              <span className="text-xs text-gray-500 font-medium">{exp.period}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{exp.company}</p>
            <AccentBulletList>
              {resolveBullets(exp).map((bullet, index) => (
                <AccentBulletItem key={`${exp.id}-bullet-${index}`}>
                  <FormattedText value={bullet} idPrefix={`exp-${exp.id}-${index}`} />
                </AccentBulletItem>
              ))}
            </AccentBulletList>
          </div>
        ))}
      </section>

      {(data.projects && data.projects.length > 0) && (
        <section className="mb-6">
          <SectionHeading>Projects</SectionHeading>
          {data.projects.map((project) => {
            const bullets = resolveProjectBullets(project)
            return (
              <div key={project.id} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-semibold text-gray-900">{project.name}</h4>
                  {project.period ? <span className="text-xs text-gray-500 font-medium">{project.period}</span> : null}
                </div>
                {project.role ? <p className="text-sm text-gray-600 mb-2">{project.role}</p> : null}
                {bullets.length > 0 && (
                  <AccentBulletList>
                    {bullets.map((line, i) => (
                      <AccentBulletItem key={`${project.id}-bullet-${i}`}>
                        <FormattedText value={line} idPrefix={`proj-${project.id}-${i}`} />
                      </AccentBulletItem>
                    ))}
                  </AccentBulletList>
                )}
                {project.technologies && project.technologies.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Technologies:</strong> {project.technologies.join(', ')}
                  </p>
                )}
                {project.url ? (
                  <p className="text-sm mt-1">
                    <a href={project.url} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: ACCENT }}>
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
          <SectionHeading>Education</SectionHeading>
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
          <SectionHeading>{section.title}</SectionHeading>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            <FormattedText value={section.content} idPrefix={`section-${section.id}`} />
          </p>
        </section>
      ))}
    </div>
  )
}
