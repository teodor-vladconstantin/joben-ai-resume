import { Heading, Text } from '@react-email/components'
import { Button } from './Button'
import { EMAIL_COLORS } from './tokens'

const p = { margin: '0 0 14px 0', fontSize: '15px', lineHeight: '24px', color: EMAIL_COLORS.ink } as const
const note = { margin: '22px 0 0 0', fontSize: '13px', lineHeight: '20px', color: EMAIL_COLORS.muted } as const

export function Title({ children }: { children: string }) {
  return (
    <Heading as="h1" style={{ margin: '0 0 14px 0', fontSize: '22px', lineHeight: '30px', fontWeight: 600, color: EMAIL_COLORS.ink }}>
      {children}
    </Heading>
  )
}

// Body shared by almost every email: heading, paragraphs, optional bullet list,
// one CTA, small note.
export function SimpleBody({
  heading,
  paragraphs,
  bullets,
  ctaHref,
  ctaLabel,
  note: noteText,
}: {
  heading: string
  paragraphs: string[]
  bullets?: string[]
  ctaHref: string
  ctaLabel: string
  note?: string
}) {
  return (
    <>
      <Title>{heading}</Title>
      {paragraphs.map((text) => (
        <Text key={text} style={p}>
          {text}
        </Text>
      ))}
      {bullets ? (
        <ul style={{ margin: '0 0 18px 18px', padding: 0, fontSize: '15px', lineHeight: '24px' }}>
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div style={{ marginTop: '8px' }}>
        <Button href={ctaHref}>{ctaLabel}</Button>
      </div>
      {noteText ? <Text style={note}>{noteText}</Text> : null}
    </>
  )
}

export function ScanReportBody({
  heading,
  intro,
  categoryLines,
  topFixes,
  issues,
  ctaHref,
  ctaLabel,
  note: noteText,
}: {
  heading: string
  intro: string
  categoryLines: string[]
  topFixes: string
  issues: { issue: string; explanation: string }[]
  ctaHref: string
  ctaLabel: string
  note: string
}) {
  return (
    <>
      <Title>{heading}</Title>
      <Text style={p}>{intro}</Text>
      <ul style={{ margin: '0 0 18px 18px', padding: 0, fontSize: '15px', lineHeight: '24px' }}>
        {categoryLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {issues.length > 0 ? (
        <>
          <Text style={{ ...p, margin: '0 0 8px 0' }}>{topFixes}</Text>
          <ul style={{ margin: '0 0 18px 18px', padding: 0, fontSize: '15px', lineHeight: '24px' }}>
            {issues.map((item) => (
              <li key={item.issue} style={{ marginBottom: '10px' }}>
                <strong>{item.issue}</strong>
                <br />
                <span style={{ color: EMAIL_COLORS.muted, fontSize: '13px' }}>{item.explanation}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <Button href={ctaHref}>{ctaLabel}</Button>
      <Text style={note}>{noteText}</Text>
    </>
  )
}
