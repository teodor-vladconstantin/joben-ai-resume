import { Button as REButton } from '@react-email/components'
import { EMAIL_COLORS, EMAIL_RADIUS } from './tokens'

export function Button({ href, children }: { href: string; children: string }) {
  return (
    <REButton
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: EMAIL_COLORS.green,
        color: EMAIL_COLORS.white,
        borderRadius: EMAIL_RADIUS,
        padding: '12px 22px',
        fontSize: '15px',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {children}
    </REButton>
  )
}
