import type { ResumeTemplateData } from './types'

type JakesTemplateProps = {
  data: ResumeTemplateData
}

function resolveBullets(exp: { bullets?: string[]; description: string }) {
  const bullets = (exp.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets
  return exp.description?.trim() ? [exp.description.trim()] : []
}

export function JakesTemplate({ data }: JakesTemplateProps) {
  return (
    <div className="p-10 text-black font-sans h-full">
      <header className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">{data.personal.firstName} {data.personal.lastName}</h1>
        <p className="text-sm text-gray-700 mt-1">{data.personal.title} | {data.personal.email} | {data.personal.phone}</p>
      </header>
      <hr className="border-gray-300 mb-5" />

      <section className="mb-5">
        <h3 className="text-base font-bold uppercase mb-2">Summary</h3>
        <p className="text-gray-800 text-sm leading-relaxed">{data.personal.summary}</p>
      </section>

      <section>
        <h3 className="text-base font-bold uppercase mb-2">Experience</h3>
        {data.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between text-sm">
              <h4 className="font-bold">{exp.title}, {exp.company}</h4>
              <span className="text-gray-600">{exp.period}</span>
            </div>
            <ul className="mt-1 space-y-1">
              {resolveBullets(exp).map((bullet, index) => (
                <li key={`${exp.id}-bullet-${index}`} className="text-sm text-gray-800">• {bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {(data.dynamicSections || []).map((section) => (
        <section key={section.id} className="mt-5">
          <h3 className="text-base font-bold uppercase mb-2">{section.title}</h3>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
        </section>
      ))}
    </div>
  )
}
