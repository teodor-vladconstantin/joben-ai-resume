import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// pdfjs loads pdf.worker.mjs at runtime, which Vercel's file tracer cannot
// see. A route that reads PDFs but is missing from outputFileTracingIncludes
// passes every local check and fails only in production ("Cannot find module
// pdf.worker.mjs"), so this guard keeps the map in sync with the routes.
function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? routeFiles(full) : name === 'route.ts' ? [full] : []
  })
}

describe('outputFileTracingIncludes', () => {
  const root = process.cwd()
  const apiDir = join(root, 'src', 'app', 'api')
  const config = readFileSync(join(root, 'next.config.ts'), 'utf8')

  const pdfRoutes = routeFiles(apiDir)
    .filter((file) => readFileSync(file, 'utf8').includes('extractTextFromPdf'))
    .map((file) => '/api/' + relative(apiDir, file).split(sep).slice(0, -1).join('/'))

  it('finds the PDF routes', () => {
    expect(pdfRoutes.length).toBeGreaterThan(0)
  })

  it.each(pdfRoutes)('%s is listed so pdf.worker.mjs ships with it', (route) => {
    expect(config).toContain(`'${route}': PDF_EXTRACTION_TRACE_INCLUDES`)
  })
})
