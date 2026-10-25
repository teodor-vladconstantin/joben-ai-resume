import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { TOUR_IDS } from '@/lib/onboarding/state'
import { TOURS } from '@/lib/onboarding/tours'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx|ts)$/.test(name) ? [path] : []
  })
}

describe('tour anchors exist in the source', () => {
  const lines = sourceFiles(join(process.cwd(), 'src'))
    .filter((file) => !file.includes(`${join('lib', 'onboarding')}`))
    .flatMap((file) => readFileSync(file, 'utf8').split(/\r?\n/))
    .filter((line) => line.includes('data-tour='))

  for (const id of TOUR_IDS) {
    for (const step of TOURS[id]) {
      it(`${id}: ${step.anchor}`, () => {
        const found = lines.some((line) => line.includes(`"${step.anchor}"`) || line.includes(`'${step.anchor}'`))
        expect(found).toBe(true)
      })
    }
  }
})
