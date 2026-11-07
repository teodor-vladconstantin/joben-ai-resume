import { notFound } from 'next/navigation'

import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false } }

const examples: Record<string, string>[] = [
  { type: 'hook', title: 'CV-ul tău este citit în **6 secunde**', body: 'Iată ce văd recrutorii primul.', n: '1', total: '7' },
  { type: 'text', title: 'Sistemele ATS **nu citesc** coloanele', body: 'Un șablon cu două coloane poate amesteca ordinea secțiunilor și îți strică profilul.', n: '2', total: '7' },
  { type: 'list', title: 'Ce să **pui** în rezumat', items: JSON.stringify(['Funcția și anii de experiență', 'Două realizări cu cifre', 'Cuvintele cheie din anunț']), n: '3', total: '7' },
  { type: 'beforeafter', title: 'Un punct **mai bun**', before: 'Responsabil de vânzări în echipă.', after: 'Am crescut vânzările echipei cu **27%** în 8 luni.', n: '4', total: '7' },
  { type: 'score', title: 'Scor **ATS**', note: '78/100', items: JSON.stringify(['Cuvinte cheie|72', 'Format|91', 'Structură|64']), n: '5', total: '7' },
  { type: 'steps', title: 'Verifică în **3 pași**', items: JSON.stringify(['Încarcă CV-ul', 'Lipește anunțul', 'Aplică sugestiile']), n: '6', total: '7' },
  { type: 'cta', title: 'Verifică-ți CV-ul **gratuit**', body: 'Durează sub un minut, fără cont.', note: 'joben.eu/ro', n: '7', total: '7' },
]

export default function SocialPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const token = process.env.SOCIAL_SLIDE_TOKEN
  if (!token) return <p className="p-8">Setează SOCIAL_SLIDE_TOKEN în .env.local și repornește serverul.</p>

  return (
    <main className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 xl:grid-cols-3">
      {examples.map((ex) => {
        const src = `/api/social/slide?${new URLSearchParams({ token, ...ex })}`
        return (
          <figure key={ex.type} className="space-y-2">
            <figcaption className="text-sm font-medium">{ex.type}</figcaption>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={ex.type} width={540} height={540} className="rounded-lg border" />
          </figure>
        )
      })}
    </main>
  )
}
