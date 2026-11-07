import React from 'react'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'

type Row = Record<string, unknown> | null | undefined
type Rows = Record<string, unknown>[] | null | undefined

export type AccountExportData = {
  exportedAt: string
  account: Row
  resumes: Rows
  coverLetters: Rows
  aiReviews: Rows
  resumeAnalyses: Rows
  feedback: Rows
  legalAcceptances: Rows
  withdrawalRequests: Rows
  referralsMade: Rows
  referralsReceived: Rows
}

// The built-in PDF fonts have no Romanian s/t with comma, so text is folded to
// plain letters. The JSON export remains the complete, lossless copy.
function fold(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ȘŞ]/g, 'S')
    .replace(/[șş]/g, 's')
    .replace(/[ȚŢ]/g, 'T')
    .replace(/[țţ]/g, 't')
}

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.5, color: '#111111' },
  h1: { fontSize: 18, marginBottom: 4 },
  h2: { fontSize: 12, marginTop: 14, marginBottom: 4 },
  muted: { color: '#555555' },
  row: { marginBottom: 2 },
})

const h = React.createElement

function section(title: string, lines: string[]) {
  return h(
    View,
    { key: title, wrap: true },
    h(Text, { style: styles.h2 }, fold(title)),
    ...(lines.length > 0 ? lines : ['-']).map((line, index) => h(Text, { key: `${title}-${index}`, style: styles.row }, fold(line)))
  )
}

const date = (value: unknown) => (typeof value === 'string' ? value.slice(0, 10) : '-')

export function buildAccountExportDocument(data: AccountExportData) {
  const account = (data.account ?? {}) as Record<string, unknown>
  const list = (rows: Rows) => rows ?? []

  const sections = [
    section('Account', [
      `Email: ${account.email ?? '-'}`,
      `Name: ${[account.first_name, account.last_name].filter(Boolean).join(' ') || '-'}`,
      `Plan: ${account.plan ?? '-'}`,
      `Created: ${date(account.created_at)}`,
      `Terms accepted: ${date(account.tos_accepted_at)} (version ${account.tos_version ?? '-'})`,
    ]),
    section(`CVs (${list(data.resumes).length})`, list(data.resumes).map((r) => `${r.title ?? 'Untitled'} | score ${r.score ?? '-'} | updated ${date(r.updated_at)}`)),
    section(`Cover letters (${list(data.coverLetters).length})`, list(data.coverLetters).map((r) => `${r.title ?? 'Untitled'} | updated ${date(r.updated_at)}`)),
    section(`AI reviews (${list(data.aiReviews).length})`, list(data.aiReviews).map((r) => `score ${r.score ?? '-'} | ${date(r.created_at)}`)),
    section(`ATS analyses (${list(data.resumeAnalyses).length})`, list(data.resumeAnalyses).map((r) => `${date(r.created_at)}`)),
    section(`Feedback messages (${list(data.feedback).length})`, list(data.feedback).map((r) => `${date(r.created_at)}`)),
    section(`Legal acceptances (${list(data.legalAcceptances).length})`, list(data.legalAcceptances).map((r) => `${date(r.accepted_at)} | version ${r.doc_version ?? '-'} | ${r.source ?? '-'}`)),
    section(`Withdrawal statements (${list(data.withdrawalRequests).length})`, list(data.withdrawalRequests).map((r) => `${date(r.created_at)} | ${r.contract_ref ?? '-'}`)),
    section('Referrals', [`Invited by you: ${list(data.referralsMade).length}`, `Invited you: ${list(data.referralsReceived).length}`]),
  ]

  return h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Text, { style: styles.h1 }, 'Joben - your data export'),
      h(Text, { style: styles.muted }, fold(`Generated ${data.exportedAt}. Controller: TETA ABC SRL, privacy@joben.eu.`)),
      h(Text, { style: [styles.muted, { marginTop: 4 }] }, 'This PDF is a readable summary. The JSON export contains the complete content of every item.'),
      ...sections
    )
  )
}

export async function renderAccountExportPdf(data: AccountExportData): Promise<ArrayBuffer> {
  const blob = await pdf(buildAccountExportDocument(data)).toBlob()
  return blob.arrayBuffer()
}
