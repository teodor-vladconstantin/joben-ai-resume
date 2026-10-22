import { z } from 'zod'

// What the consumer must provide to withdraw (Directive 2011/83/EU art. 11a):
// name, contract identification and contact details. The contract reference is
// optional because the account email already identifies the contract.
export const withdrawalSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  contractRef: z.string().trim().max(200).optional(),
  locale: z.enum(['ro', 'en']).default('ro'),
  confirm: z.literal(true),
})

export type WithdrawalInput = z.infer<typeof withdrawalSchema>

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

// Acknowledgement of receipt on a durable medium (email), with the content of
// the declaration and the date and time it was received.
export function buildWithdrawalAcknowledgement(input: WithdrawalInput, receivedAt: Date) {
  const ro = input.locale === 'ro'
  const when = receivedAt.toLocaleString(ro ? 'ro-RO' : 'en-GB', { timeZone: 'Europe/Bucharest', dateStyle: 'long', timeStyle: 'medium' })
  const name = escapeHtml(input.name)
  const ref = input.contractRef ? escapeHtml(input.contractRef) : (ro ? 'contul asociat acestei adrese de email' : 'the account linked to this email address')

  return ro
    ? {
        subject: 'Confirmare: am primit declarația ta de retragere',
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:20px;">Am primit declarația ta de retragere</h1>
  <p>Data și ora primirii: <strong>${when}</strong> (ora României).</p>
  <p>Conținutul declarației: eu, <strong>${name}</strong>, mă retrag din contractul privind serviciile Joben (${ref}), încheiat cu TETA ABC SRL.</p>
  <p>Revenim în cel mult 14 zile cu rambursarea sumelor plătite, prin aceeași metodă de plată. Dacă ai cerut începerea imediată a accesului, se reține o sumă proporțională cu perioada de acces folosită.</p>
  <p style="color:#5C5C57;font-size:13px;">TETA ABC SRL, CUI 22404824, hello@joben.eu. Păstrează acest email ca dovadă.</p>
</div>`,
      }
    : {
        subject: 'Confirmation: we received your withdrawal statement',
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:20px;">We received your withdrawal statement</h1>
  <p>Date and time received: <strong>${when}</strong> (Romania time).</p>
  <p>Content of the statement: I, <strong>${name}</strong>, withdraw from the contract for Joben services (${ref}) concluded with TETA ABC SRL.</p>
  <p>We will refund the amounts paid within 14 days at most, using the same payment method. If you asked for access to start immediately, an amount proportionate to the access period used is withheld.</p>
  <p style="color:#5C5C57;font-size:13px;">TETA ABC SRL, tax ID 22404824, hello@joben.eu. Keep this email as proof.</p>
</div>`,
      }
}
