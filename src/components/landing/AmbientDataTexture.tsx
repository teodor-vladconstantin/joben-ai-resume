const SNIPPETS: { text: string; top: string; left: string }[] = [
  { text: 'ATS score 54 → 87', top: '8%', left: '4%' },
  { text: 'Bullet rewritten', top: '18%', left: '78%' },
  { text: 'Keyword matched: kubernetes', top: '30%', left: '2%' },
  { text: 'Cover letter generated', top: '6%', left: '62%' },
  { text: 'Resume tailored to JD', top: '44%', left: '85%' },
  { text: 'v2 → v3', top: '58%', left: '6%' },
  { text: '3 keywords added', top: '70%', left: '70%' },
  { text: 'Score +12', top: '80%', left: '10%' },
  { text: 'PDF exported', top: '12%', left: '40%' },
  { text: 'Content quality 20/40', top: '66%', left: '38%' },
  { text: 'Auto-fix applied', top: '86%', left: '55%' },
  { text: 'Recruiter-ready', top: '38%', left: '50%' },
]

export function AmbientDataTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {SNIPPETS.map((snippet) => (
        <span
          key={snippet.text}
          className="absolute whitespace-nowrap font-mono text-[11px] text-(--foreground)/[0.06]"
          style={{ top: snippet.top, left: snippet.left }}
        >
          {snippet.text}
        </span>
      ))}
    </div>
  )
}
