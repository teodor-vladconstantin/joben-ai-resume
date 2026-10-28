import type { ReactNode } from 'react'
import { Body, Container, Head, Html, Link, Preview, Section, Text } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_FONT, EMAIL_RADIUS } from './tokens'

const SITE = 'https://joben.eu'

export type UnsubscribeLink = { url: string; label: string }

// Shell for every Joben email: wordmark header, white card on paper, footer
// with company details and (when present) the unsubscribe link that
// sendEmail builds and signs.
export function Layout({
  preview,
  unsubscribe,
  children,
}: {
  preview?: string
  unsubscribe?: UnsubscribeLink
  children: ReactNode
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- email markup, not a Next page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </Head>
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ margin: 0, padding: '24px 12px', backgroundColor: EMAIL_COLORS.paper, fontFamily: EMAIL_FONT, color: EMAIL_COLORS.ink }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Section style={{ padding: '0 4px 16px 4px' }}>
            <Link
              href={SITE}
              style={{ color: EMAIL_COLORS.ink, fontSize: '22px', fontWeight: 600, textDecoration: 'none', letterSpacing: '-0.02em' }}
            >
              <span style={{ color: EMAIL_COLORS.green }}>&#9679;</span> Joben
            </Link>
          </Section>
          <Section
            style={{
              backgroundColor: EMAIL_COLORS.white,
              border: `1px solid ${EMAIL_COLORS.line}`,
              borderRadius: EMAIL_RADIUS,
              padding: '28px 28px 24px 28px',
            }}
          >
            {children}
          </Section>
          <Section style={{ padding: '16px 4px 0 4px', textAlign: 'center' }}>
            <Text style={{ margin: '0 0 6px 0', fontSize: '12px', lineHeight: '18px', color: EMAIL_COLORS.muted }}>
              TETA ABC SRL &middot;{' '}
              <Link href="mailto:hello@joben.eu" style={{ color: EMAIL_COLORS.muted }}>
                hello@joben.eu
              </Link>
            </Text>
            {unsubscribe ? (
              <Text style={{ margin: 0, fontSize: '12px', lineHeight: '18px' }}>
                <Link href={unsubscribe.url} style={{ color: EMAIL_COLORS.muted, textDecoration: 'underline' }}>
                  {unsubscribe.label}
                </Link>
              </Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
