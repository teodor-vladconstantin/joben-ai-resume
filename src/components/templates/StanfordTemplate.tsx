import type { ResumeTemplateData } from './types'

type StanfordTemplateProps = {
  data: ResumeTemplateData
}

function resolveBullets(exp: { bullets?: string[]; description: string }) {
  const bullets = (exp.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets
  return exp.description?.trim() ? [exp.description.trim()] : []
}

export function StanfordTemplate({ data }: StanfordTemplateProps) {
  return (
    <div className="p-12 text-black font-sans h-full">
      <div className="flex gap-5">
        <div className="w-1 bg-[#0A9548] rounded"></div>
        <div className="flex-1">
          <h1 className="text-5xl font-black tracking-tight">{data.personal.firstName} {data.personal.lastName}</h1>
          <h2 className="text-xl text-[#0A9548] font-semibold mt-1">{data.personal.title}</h2>
          <p className="text-sm text-gray-600 mt-3">{data.personal.email}  -  {data.personal.phone}</p>
        </div>
      </div>

      <section className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Profile</h3>
        <p className="text-gray-800 leading-relaxed">{data.personal.summary}</p>
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-2">Experience</h3>
        <div className="space-y-4">
          {data.experience.map((exp) => (
            <div key={exp.id} className="border-l-2 border-gray-300 pl-4">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-gray-900">{exp.title}</h4>
                <span className="text-sm text-gray-600">{exp.period}</span>
              </div>
              <p className="text-gray-700 font-medium">{exp.company}</p>
              <ul className="mt-1 space-y-1">
                {resolveBullets(exp).map((bullet, index) => (
                  <li key={`${exp.id}-bullet-${index}`} className="text-gray-800">- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {(data.dynamicSections || []).map((section) => (
        <section key={section.id} className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/60 mb-2">{section.title}</h3>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{section.content}</p>
        </section>
      ))}
    </div>
  )
}


