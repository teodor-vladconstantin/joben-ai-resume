import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { z } from 'zod'

export const SLIDE_SIZE = 1080
export const SLIDE_TYPES = ['hook', 'text', 'list', 'beforeafter', 'score', 'steps', 'cta'] as const

const C = {
  bg: '#111113',
  text: '#f4f4f5',
  card: '#18181b',
  border: '#27272a',
  muted: '#a1a1aa',
  accent: '#34d399',
  onAccent: '#111113',
}

// One family per weight, each followed by its latin-ext twin (carries ăâîșț) as per-glyph fallback.
const REG = 'Inter, InterX'
const BOLD = 'InterBold, InterBoldX'

const text = (max: number) => z.string().trim().min(1).max(max)
const itemsParam = z
  .string()
  .max(1200)
  .transform((s, ctx) => {
    try {
      return JSON.parse(s) as unknown
    } catch {
      ctx.addIssue({ code: 'custom', message: 'items must be JSON' })
      return z.NEVER
    }
  })
  .pipe(z.array(text(90)).min(1).max(6))

// strict(): unknown query params are rejected, not ignored.
export const slideSchema = z
  .object({
    token: z.string(),
    type: z.enum(SLIDE_TYPES),
    title: text(90).optional(),
    body: text(260).optional(),
    items: itemsParam.optional(),
    before: text(220).optional(),
    after: text(220).optional(),
    n: z.coerce.number().int().min(1).max(10).optional(),
    total: z.coerce.number().int().min(1).max(10).optional(),
    note: text(100).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const need: Record<(typeof SLIDE_TYPES)[number], (keyof typeof v)[]> = {
      hook: ['title'],
      text: ['title', 'body'],
      list: ['title', 'items'],
      beforeafter: ['before', 'after'],
      score: ['title', 'items', 'note'],
      steps: ['title', 'items'],
      cta: ['title'],
    }
    for (const k of need[v.type]) {
      if (v[k] === undefined) ctx.addIssue({ code: 'custom', path: [k], message: `${k} is required for type ${v.type}` })
    }
    if (v.n && v.total && v.n > v.total) ctx.addIssue({ code: 'custom', path: ['n'], message: 'n must be <= total' })
  })

export type SlideParams = z.infer<typeof slideSchema>

// Words rendered as separate flex items so **highlighted** words can be green and still wrap.
function Rich({ value, size, weight = 700, color = C.text, spacing = 0, lineHeight = 1.1 }: {
  value: string
  size: number
  weight?: number
  color?: string
  spacing?: number
  lineHeight?: number
}) {
  const words: { w: string; hl: boolean }[] = []
  value.split(/(\*\*.+?\*\*)/).forEach((part) => {
    const hl = part.startsWith('**') && part.endsWith('**') && part.length > 4
    const clean = hl ? part.slice(2, -2) : part
    clean.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, hl }))
  })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: size, fontWeight: weight, fontFamily: weight >= 700 ? BOLD : REG, letterSpacing: spacing, lineHeight }}>
      {words.map((x, i) => (
        <span key={i} style={{ color: x.hl ? C.accent : color, marginRight: size * 0.26 }}>
          {x.w}
        </span>
      ))}
    </div>
  )
}

const titleSize = (t: string) => (t.length <= 28 ? 104 : t.length <= 55 ? 84 : 68)
const card = { display: 'flex', flexDirection: 'column' as const, background: C.card, border: `2px solid ${C.border}`, borderRadius: 28, padding: 36 }

function Body({ p }: { p: SlideParams }) {
  const title = p.title ?? ''
  switch (p.type) {
    case 'hook':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <Rich value={title} size={titleSize(title) + 12} spacing={-4} lineHeight={1.05} />
          {p.body && <Rich value={p.body} size={36} weight={400} color={C.muted} lineHeight={1.35} />}
        </div>
      )
    case 'text':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <Rich value={title} size={titleSize(title)} spacing={-3} />
          <Rich value={p.body!} size={40} weight={400} color={C.muted} lineHeight={1.4} />
        </div>
      )
    case 'list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <Rich value={title} size={64} spacing={-2.5} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {p.items!.map((it, i) => (
              <div key={i} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 24, padding: '24px 32px' }}>
                <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 8, background: C.accent }} />
                <Rich value={it} size={34} weight={400} lineHeight={1.25} />
              </div>
            ))}
          </div>
        </div>
      )
    case 'beforeafter':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {title && <Rich value={title} size={60} spacing={-2.5} />}
          <div style={{ ...card, gap: 14 }}>
            <div style={{ display: 'flex', fontSize: 24, fontFamily: BOLD, fontWeight: 700, color: C.muted, letterSpacing: 2 }}>ÎNAINTE</div>
            <Rich value={p.before!} size={34} weight={400} color={C.muted} lineHeight={1.3} />
          </div>
          <div style={{ ...card, gap: 14, border: `2px solid ${C.accent}` }}>
            <div style={{ display: 'flex', fontSize: 24, fontFamily: BOLD, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>DUPĂ</div>
            <Rich value={p.after!} size={34} weight={400} lineHeight={1.3} />
          </div>
        </div>
      )
    case 'score':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <Rich value={title} size={52} spacing={-2} />
          <div style={{ display: 'flex', fontSize: 190, fontFamily: BOLD, fontWeight: 700, letterSpacing: -8, color: C.accent, lineHeight: 1 }}>{p.note}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {p.items!.map((it, i) => {
              const [label, raw] = it.split('|')
              const pct = Math.max(0, Math.min(100, parseInt(raw ?? '', 10) || 0))
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: C.muted }}>
                    <span>{label}</span>
                    <span style={{ color: C.text, fontFamily: BOLD, fontWeight: 700 }}>{raw ? pct : ''}</span>
                  </div>
                  <div style={{ display: 'flex', height: 14, borderRadius: 7, background: C.border }}>
                    <div style={{ display: 'flex', width: `${pct}%`, height: 14, borderRadius: 7, background: C.accent }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    case 'steps':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <Rich value={title} size={64} spacing={-2.5} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {p.items!.map((it, i) => (
              <div key={i} style={{ ...card, flexDirection: 'row', alignItems: 'center', gap: 28, padding: '22px 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 28, background: C.accent, color: C.onAccent, fontSize: 30, fontFamily: BOLD, fontWeight: 700 }}>
                  {i + 1}
                </div>
                <Rich value={it} size={34} weight={400} lineHeight={1.25} />
              </div>
            ))}
          </div>
        </div>
      )
    case 'cta':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <Rich value={title} size={titleSize(title)} spacing={-3} />
          {p.body && <Rich value={p.body} size={38} weight={400} color={C.muted} lineHeight={1.35} />}
          <div style={{ display: 'flex', alignSelf: 'flex-start', background: C.accent, color: C.onAccent, fontSize: 40, fontFamily: BOLD, fontWeight: 700, padding: '26px 52px', borderRadius: 999 }}>
            {p.note ?? 'joben.eu'}
          </div>
        </div>
      )
  }
}

// Read from disk on the Node runtime; next.config.ts traces src/assets/fonts into /api/social/slide.
const font = (file: string) => readFile(path.join(process.cwd(), 'src/assets/fonts', file))
const fontFiles = () =>
  Promise.all([
    font('inter-latin-400.woff'),
    font('inter-latin-700.woff'),
    font('inter-latin-ext-400.woff'),
    font('inter-latin-ext-700.woff'),
  ])

export async function renderSlide(p: SlideParams) {
  const [l4, l7, e4, e7] = await fontFiles()
  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: C.bg, color: C.text, padding: 86, fontFamily: REG }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, fontFamily: BOLD, fontWeight: 700, color: C.muted }}>
          <span>joben.eu</span>
          {p.n && p.total ? <span>{`${p.n} / ${p.total}`}</span> : <span />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <Body p={p} />
        </div>
      </div>
    ),
    {
      width: SLIDE_SIZE,
      height: SLIDE_SIZE,
      fonts: [
        { name: 'Inter', data: l4, weight: 400, style: 'normal' },
        { name: 'InterX', data: e4, weight: 400, style: 'normal' },
        { name: 'InterBold', data: l7, weight: 700, style: 'normal' },
        { name: 'InterBoldX', data: e7, weight: 700, style: 'normal' },
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' },
    }
  )
}
