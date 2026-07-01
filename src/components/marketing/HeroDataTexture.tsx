const snippets = [
  { text: 'resume tailored · Stripe', top: '8%', left: '4%', rotate: '-3deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.12]' },
  { text: 'score 92 / 100', top: '14%', left: '78%', rotate: '2deg', size: 'text-small', tone: 'text-accent', opacity: 'opacity-[0.14]' },
  { text: 'match found · Notion', top: '22%', left: '58%', rotate: '-1deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
  { text: 'ATS check passed', top: '30%', left: '10%', rotate: '1deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
  { text: 'cover letter generated', top: '6%', left: '38%', rotate: '3deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
  { text: 'bullet rewritten', top: '46%', left: '84%', rotate: '-2deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.12]' },
  { text: '12 roles matched today', top: '60%', left: '6%', rotate: '2deg', size: 'text-small', tone: 'text-accent', opacity: 'opacity-[0.12]' },
  { text: 'interview prep · system design', top: '66%', left: '62%', rotate: '-1deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
  { text: 'PDF exported', top: '78%', left: '20%', rotate: '1deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
  { text: 'ready to send', top: '86%', left: '70%', rotate: '-2deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.12]' },
  { text: 'match found · Vercel', top: '38%', left: '30%', rotate: '2deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.08]' },
  { text: 'score 78 / 100', top: '90%', left: '42%', rotate: '-1deg', size: 'text-xs', tone: 'text-text-muted', opacity: 'opacity-[0.1]' },
] as const

export function HeroDataTexture() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {snippets.map((s, i) => (
        <span
          key={i}
          className={`absolute whitespace-nowrap font-mono uppercase tracking-wide ${s.size} ${s.tone} ${s.opacity}`}
          style={{ top: s.top, left: s.left, transform: `rotate(${s.rotate})` }}
        >
          {s.text}
        </span>
      ))}
    </div>
  )
}
