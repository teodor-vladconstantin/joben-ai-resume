// Content-shaping logic shared by resume template renderers (currently just
// HarvardTemplate). Kept separate from any one template's visual styling so
// a future template only has to write layout/CSS, not re-derive bullet
// resolution, education parsing, or contact-link handling from scratch.

import { Fragment } from 'react'
import type { ResumeEducation, ResumePersonal } from './types'
import { tokenizeInline } from '@/lib/inline-format'

export function FormattedText({ value, idPrefix }: { value: string | null | undefined; idPrefix: string }) {
  if (!value) return null
  const tokens = tokenizeInline(value)
  if (tokens.length === 0) return <>{value}</>
  return (
    <>
      {tokens.map((token, index) => {
        const key = `${idPrefix}-${index}`
        if (token.kind === 'text') return <Fragment key={key}>{token.value}</Fragment>
        if (token.format === 'bold') return <strong key={key}>{token.value}</strong>
        if (token.format === 'italic') return <em key={key}>{token.value}</em>
        return <u key={key}>{token.value}</u>
      })}
    </>
  )
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatEducationPeriod(entry: ResumeEducation): string {
  const startLabel = entry.startYear
    ? entry.startMonth
      ? `${MONTH_LABELS[entry.startMonth - 1]} ${entry.startYear}`
      : `${entry.startYear}`
    : ''
  const endLabel = entry.isCurrent
    ? 'Present'
    : entry.endYear
      ? entry.endMonth
        ? `${MONTH_LABELS[entry.endMonth - 1]} ${entry.endYear}`
        : `${entry.endYear}`
      : ''

  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  if (startLabel) return startLabel
  if (endLabel) return endLabel
  return ''
}

export function buildEducationDegreeLine(entry: ResumeEducation): string {
  return [entry.degree, entry.field].map((part) => (part || '').trim()).filter(Boolean).join(', ')
}

export function normalizeContactText(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '')
}

// LinkedIn / GitHub / website fields are free-text inputs in the builder, so
// users frequently leave the placeholder copy in place ("LinkedIn Link",
// "https://github.com/yourusername"). Render these as plain text — never as
// hyperlinks — so the exported PDF never points at a broken URL.
const PLACEHOLDER_TOKENS = /yourusername|placeholder|example\.com/i

export function looksLikeUrl(value: string | undefined | null): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (PLACEHOLDER_TOKENS.test(trimmed)) return false
  // Accept both fully-qualified URLs and bare domains like "linkedin.com/in/foo".
  if (/^https?:\/\//i.test(trimmed)) return true
  return /^([\w-]+\.)+[a-z]{2,}(\/|$)/i.test(trimmed)
}

export function normalizeHref(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export type ContactItem = { label: string; value: string; href: string | null }

export function buildContactItems(personal: ResumePersonal): ContactItem[] {
  const linkedinHref = looksLikeUrl(personal.linkedin) ? normalizeHref(personal.linkedin!) : null
  const githubHref = looksLikeUrl(personal.github) ? normalizeHref(personal.github!) : null
  const websiteHref = looksLikeUrl(personal.website) ? normalizeHref(personal.website!) : null

  return [
    personal.email ? { label: 'Email', value: personal.email, href: `mailto:${personal.email}` } : null,
    personal.phone ? { label: 'Phone', value: personal.phone, href: `tel:${personal.phone.replace(/[^+\d]/g, '')}` } : null,
    personal.location ? { label: 'Location', value: personal.location, href: null } : null,
    linkedinHref ? { label: 'LinkedIn', value: normalizeContactText(linkedinHref), href: linkedinHref } : null,
    githubHref ? { label: 'GitHub', value: normalizeContactText(githubHref), href: githubHref } : null,
    websiteHref ? { label: 'Website', value: normalizeContactText(websiteHref), href: websiteHref } : null,
  ].filter(Boolean) as ContactItem[]
}

export function resolveBullets(exp: { bullets?: string[]; description: string }): string[] {
  const bullets = (exp.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets
  return exp.description?.trim() ? [exp.description.trim()] : []
}

export function resolveProjectBullets(project: { bullets?: string[]; description?: string }): string[] {
  // Prefer structured bullets, then fall back to splitting the description on newlines so
  // imported descriptions render as discrete line items instead of one wall of text.
  const bullets = (project.bullets || []).map((bullet) => bullet.trim()).filter(Boolean)
  if (bullets.length > 0) return bullets

  const description = (project.description || '').trim()
  if (!description) return []

  const byLine = description.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean)
  if (byLine.length > 0) return byLine

  return [description]
}

export type EduEntry = {
  institution: string
  degreeLines: string[]
}

export function parseEducationEntries(content: string): EduEntry[] {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return { institution: '', degreeLines: [] }

    const institution = lines[0]
    const degreeLines = lines.slice(1)
    return { institution, degreeLines }
  })
}
