import type { ReactNode } from 'react'
import { Body, Container, Head, Html, Img, Link, Preview, Section, Text } from '@react-email/components'
import { company } from '@/lib/content'
import { EMAIL_COLORS, EMAIL_FONT, EMAIL_RADIUS } from './tokens'

const SITE = 'https://joben.eu'
const LOGO = `${SITE}/jobeneu_logo.jpg`

export type UnsubscribeLink = { url: string; label: string }
export type EmailLocale = 'ro' | 'en'

const FOOTER_COPY: Record<EmailLocale, { terms: string; privacy: string; rights: string; cui: string }> = {
  en: { terms: 'Terms & Conditions', privacy: 'Privacy Policy', rights: 'All rights reserved.', cui: 'Tax ID (CUI)' },
  ro: { terms: 'Termeni și condiții', privacy: 'Politica de confidențialitate', rights: 'Toate drepturile rezervate.', cui: 'CUI' },
}

// Shell for every Joben email: wordmark header, white card on paper, footer
// with company details and (when present) the unsubscribe link that
// sendEmail builds and signs.
export function Layout({
  preview,
  unsubscribe,
  locale = 'en',
  children,
}: {
  preview?: string
  locale?: EmailLocale
  unsubscribe?: UnsubscribeLink
  children: ReactNode
}) {
  const t = FOOTER_COPY[locale]
  return (
    <Html lang={locale}>
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
          <Section style={{ backgroundColor: '#000000', borderRadius: `${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0`, padding: '14px 24px' }}>
            <Link href={`${SITE}/${locale}`} style={{ textDecoration: 'none' }}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td style={{ verticalAlign: 'middle' }}>
                      <Img src={LOGO} width={44} height={44} alt="Joben" style={{ display: 'block', border: 0 }} />
                    </td>
                    <td style={{ verticalAlign: 'middle', paddingLeft: '12px', color: '#ffffff', fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em' }}>
                      Joben
                    </td>
                  </tr>
                </tbody>
              </table>
            </Link>
          </Section>
          <Section
            style={{
              backgroundColor: EMAIL_COLORS.white,
              border: `1px solid ${EMAIL_COLORS.line}`,
              borderTop: `3px solid ${EMAIL_COLORS.green}`,
              borderRadius: `0 0 ${EMAIL_RADIUS} ${EMAIL_RADIUS}`,
              padding: '28px 28px 24px 28px',
            }}
          >
            {children}
          </Section>
          <Section style={{ padding: '16px 4px 0 4px', textAlign: 'center' }}>
            <Text style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '18px', color: EMAIL_COLORS.muted }}>
              <Link href={`${SITE}/${locale}/terms`} style={{ color: EMAIL_COLORS.muted }}>
                {t.terms}
              </Link>
              {' · '}
              <Link href={`${SITE}/${locale}/privacy`} style={{ color: EMAIL_COLORS.muted }}>
                {t.privacy}
              </Link>
              {' · '}
              <Link href={`mailto:${company.email}`} style={{ color: EMAIL_COLORS.muted }}>
                {company.email}
              </Link>
            </Text>
            <Text style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '18px', color: EMAIL_COLORS.muted }}>
              &copy; {new Date().getFullYear()} {company.legalName}. {t.rights}
              <br />
              {t.cui} {company.cui} &middot; {company.regCom}
              <br />
              {company.address}
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
