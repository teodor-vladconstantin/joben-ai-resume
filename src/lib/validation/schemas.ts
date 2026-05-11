// SECURITY: shared Zod primitives + per-route schemas (CLAUDE.md High #2).
// Every API route that accepts JSON should validate the payload through one
// of these schemas before touching the database, the AI provider, or the
// PDF service.

import { z } from 'zod'

// --- Primitive caps (kept in one place so we tune them centrally) ---

export const SHORT_TEXT_MAX = 200          // titles, role names, names
export const MEDIUM_TEXT_MAX = 1_200       // single bullet, single section
export const LONG_TEXT_MAX = 10_000        // job descriptions, role briefs
export const RESUME_TEXT_MAX = 32_000      // full resume free-text input
export const COVER_LETTER_CONTENT_MAX = 20_000
export const RESUME_DATA_MAX_BYTES = 200_000 // serialized JSON size cap

// --- Reusable atoms ---

export const trimmedString = (max: number) =>
  z.string().trim().max(max)

export const optionalTrimmedString = (max: number) =>
  z.string().trim().max(max).optional()

export const nonEmptyTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max)

export const uuidLike = z
  .string()
  .trim()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, { message: 'Invalid identifier format' })

export const isoDateString = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must use YYYY-MM-DD format',
})

export const planIdEnum = z.enum(['free', 'pro', 'recruiting'])

// --- Resume payload (kept permissive on shape, strict on size) ---

export const resumePersonalSchema = z
  .object({
    firstName: optionalTrimmedString(SHORT_TEXT_MAX),
    lastName: optionalTrimmedString(SHORT_TEXT_MAX),
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    email: optionalTrimmedString(SHORT_TEXT_MAX),
    phone: optionalTrimmedString(SHORT_TEXT_MAX),
    location: optionalTrimmedString(SHORT_TEXT_MAX),
    summary: optionalTrimmedString(LONG_TEXT_MAX),
    linkedin: optionalTrimmedString(SHORT_TEXT_MAX),
    github: optionalTrimmedString(SHORT_TEXT_MAX),
    website: optionalTrimmedString(SHORT_TEXT_MAX),
  })
  .partial()
  .passthrough()

// We allow the resume builder to evolve without rejecting unknown keys, but
// we still enforce a hard byte budget on the serialized blob (see helpers
// below) to prevent storage abuse.
export const resumeDataSchema = z.record(z.string(), z.unknown())

// --- Per-route schemas ---

export const createResumeSchema = z
  .object({
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    data: resumeDataSchema.optional(),
  })
  .strict()

export const updateResumeSchema = z
  .object({
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    data: resumeDataSchema.optional(),
  })
  .strict()

export const createCoverLetterSchema = z
  .object({
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    content: optionalTrimmedString(COVER_LETTER_CONTENT_MAX),
  })
  .strict()

export const updateCoverLetterSchema = z
  .object({
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    content: optionalTrimmedString(COVER_LETTER_CONTENT_MAX),
  })
  .strict()

export const analyzeSchema = z
  .object({
    resumeText: nonEmptyTrimmedString(RESUME_TEXT_MAX),
    jobDescription: optionalTrimmedString(LONG_TEXT_MAX),
    resumeId: uuidLike.optional(),
  })
  .strict()

export const tailorSchema = z
  .object({
    resumeData: resumeDataSchema,
    jobDescription: nonEmptyTrimmedString(LONG_TEXT_MAX),
    optimizationType: z.enum(['job_specific', 'general']).optional(),
  })
  .strict()

export const improveBulletSchema = z
  .object({
    bullet: nonEmptyTrimmedString(MEDIUM_TEXT_MAX),
    context: optionalTrimmedString(LONG_TEXT_MAX),
  })
  .strict()

export const coverLetterAiSchema = z
  .object({
    resumeText: optionalTrimmedString(RESUME_TEXT_MAX),
    company: nonEmptyTrimmedString(SHORT_TEXT_MAX),
    position: nonEmptyTrimmedString(SHORT_TEXT_MAX),
    jobDescription: nonEmptyTrimmedString(LONG_TEXT_MAX),
    tone: optionalTrimmedString(SHORT_TEXT_MAX),
  })
  .strict()

export const generateSummarySchema = z
  .object({
    mode: z.enum(['resume', 'scratch']),
    roleDescription: optionalTrimmedString(LONG_TEXT_MAX),
    resumeData: resumeDataSchema.optional(),
  })
  .strict()

export const improvementSchema = z
  .object({
    issue: optionalTrimmedString(MEDIUM_TEXT_MAX),
    weak_example: optionalTrimmedString(MEDIUM_TEXT_MAX),
    strong_example: optionalTrimmedString(MEDIUM_TEXT_MAX),
  })
  .strict()

export const applyFixSchema = z
  .object({
    resumeId: uuidLike,
    reviewId: uuidLike.optional(),
    improvement: improvementSchema,
  })
  .strict()

export const autoFixSchema = z
  .object({
    resumeId: uuidLike,
    reviewId: uuidLike.optional(),
    improvements: z.array(improvementSchema).min(1).max(10),
  })
  .strict()

export const resumeAnalysisCreateSchema = z
  .object({
    reviewId: uuidLike,
    resumeId: uuidLike.optional(),
    analysisJson: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(['pending', 'applied']).optional(),
  })
  .strict()

export const resumeAnalysisPatchSchema = z
  .object({
    reviewId: uuidLike,
    status: z.enum(['pending', 'applied']).optional(),
  })
  .strict()

export const adminRateLimitPostSchema = z
  .object({
    action: z.enum(['block', 'unblock']),
    userId: nonEmptyTrimmedString(SHORT_TEXT_MAX),
    feature: z.enum(['covers', 'jds', 'bullets', 'reviews', 'summaries', 'cvs']),
  })
  .strict()

export const redeemCodeSchema = z
  .object({
    code: nonEmptyTrimmedString(SHORT_TEXT_MAX),
  })
  .strict()

export const exportLatexSchema = z
  .object({
    data: resumeDataSchema,
  })
  .passthrough()

export const coverLetterPdfSectionsSchema = z
  .object({
    headerName: optionalTrimmedString(SHORT_TEXT_MAX),
    headerEmail: optionalTrimmedString(SHORT_TEXT_MAX),
    headerPhone: optionalTrimmedString(SHORT_TEXT_MAX),
    date: optionalTrimmedString(SHORT_TEXT_MAX),
    recipientName: optionalTrimmedString(SHORT_TEXT_MAX),
    recipientTitle: optionalTrimmedString(SHORT_TEXT_MAX),
    company: optionalTrimmedString(SHORT_TEXT_MAX),
    salutation: optionalTrimmedString(SHORT_TEXT_MAX),
    introduction: optionalTrimmedString(MEDIUM_TEXT_MAX),
    bodyParagraphs: z.array(trimmedString(MEDIUM_TEXT_MAX)).max(30).optional(),
    conclusion: optionalTrimmedString(MEDIUM_TEXT_MAX),
    closingSignature: optionalTrimmedString(MEDIUM_TEXT_MAX),
  })
  .strict()

export const coverLetterPdfSchema = z
  .object({
    title: optionalTrimmedString(SHORT_TEXT_MAX),
    sections: coverLetterPdfSectionsSchema.optional(),
  })
  .strict()

// --- Helpers ---

export type ZodLikeIssue = { path: (string | number)[]; message: string }

export function flattenZodIssues(error: z.ZodError): ZodLikeIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path as (string | number)[],
    message: issue.message,
  }))
}

/**
 * Cheap byte-budget guard for endpoints that accept arbitrary JSON (resume
 * data, dynamic sections). Counts UTF-8 bytes after serialization.
 */
export function exceedsJsonBudget(value: unknown, maxBytes = RESUME_DATA_MAX_BYTES): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(value ?? null)).byteLength > maxBytes
  } catch {
    return true
  }
}
