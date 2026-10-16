import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { extractTextFromDocx } from '@/lib/docx-text-extract'
import { analyzeResumeTextLightweight } from '@/lib/ats-fast-parser'
import { CV_TEMPLATES } from '@/data/cv-templates'

// Downloadable templates must stay readable by the same parser the free ATS
// checker uses: text extracts in order, contact details and the main sections
// are detected, no formatting problem is flagged as critical.
describe('downloadable CV templates', () => {
  for (const template of CV_TEMPLATES) {
    for (const lang of ['ro', 'en'] as const) {
      it(`${template.id} (${lang}) parses cleanly`, async () => {
        const file = readFileSync(`public${template.file(lang)}`)
        const text = await extractTextFromDocx(new Uint8Array(file))
        const result = analyzeResumeTextLightweight(text)

        expect(text).not.toMatch(/\|\s*\|/)
        expect(result.hasEmail).toBe(true)
        expect(result.hasPhone).toBe(true)
        expect(result.hasLinkedIn).toBe(true)
        for (const section of template.sections) {
          expect(result.detectedSections).toContain(section)
        }
        // A template is short by design and carries placeholders instead of metrics.
        const ignored = ['short_resume', 'lack_of_metrics']
        expect(result.issues.filter((i) => i.severity === 'critical' && !ignored.includes(i.id))).toEqual([])
      })
    }
  }
})
