import type { ResumeTemplateData } from './types'

type MattyTemplateProps = {
  data: ResumeTemplateData
}

function resolveBullets(exp: { bullets?: string[]; description: string }) {
  const bullets = (exp.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets
  return exp.description?.trim() ? [exp.description.trim()] : []
}

export function MattyTemplate({ data }: MattyTemplateProps) {
  return (
    <div className="p-10 text-black font-sans h-full bg-white">
      <div className="grid grid-cols-3 gap-6">
        <aside className="col-span-1 bg-gray-100 rounded-lg p-4">
          <h1 className="text-xl font-black uppercase leading-tight">{data.personal.firstName}<br />{data.personal.lastName}</h1>
          <p className="text-sm text-gray-700 mt-2">{data.personal.title}</p>
          <div className="mt-5 text-xs text-gray-700 space-y-1">
            <p>{data.personal.email}</p>
            <p>{data.personal.phone}</p>
          </div>
        </aside>

        <main className="col-span-2">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Summary</h3>
            <p className="text-sm text-gray-800 leading-relaxed">{data.personal.summary}</p>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Experience</h3>
            {data.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <div className="flex justify-between text-sm">
                  <h4 className="font-bold">{exp.title}</h4>
                  <span className="text-gray-600">{exp.period}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{exp.company}</p>
                <ul className="mt-1 space-y-1">
                  {resolveBullets(exp).map((bullet, index) => (
                    <li key={`${exp.id}-bullet-${index}`} className="text-sm text-gray-800">- {bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {(data.dynamicSections || []).map((section) => (
            <section key={section.id} className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}

