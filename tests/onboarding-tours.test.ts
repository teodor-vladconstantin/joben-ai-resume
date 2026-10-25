import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { TOUR_IDS } from '@/lib/onboarding/state'
import { TOURS } from '@/lib/onboarding/tours'
import { resolveSteps, selectorFor } from '@/lib/onboarding/steps'

type Json = { [key: string]: Json | string }

function loadMessages(locale: 'en' | 'ro'): Json {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Json
}

function leafPaths(node: Json | string, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix]
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key))
}

function pick(root: Json, path: string): string | undefined {
  let node: Json | string | undefined = root
  for (const part of path.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

describe('tour registry', () => {
  it('has a non-empty tour for every tour id', () => {
    for (const id of TOUR_IDS) expect(TOURS[id].length).toBeGreaterThan(0)
  })

  it('uses unique anchors across all tours', () => {
    const anchors = TOUR_IDS.flatMap((id) => TOURS[id].map((step) => step.anchor))
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('has a title and a body in both locales for every step', () => {
    for (const locale of ['en', 'ro'] as const) {
      const messages = loadMessages(locale)
      for (const id of TOUR_IDS) {
        for (const step of TOURS[id]) {
          for (const field of ['title', 'body']) {
            const text = pick(messages, `Onboarding.tours.${id}.${step.key}.${field}`)
            expect(text, `${locale} ${id}.${step.key}.${field}`).toBeTruthy()
          }
        }
      }
    }
  })

  it('keeps the Onboarding key sets identical in en and ro and free of em dashes', () => {
    const en = loadMessages('en').Onboarding as Json
    const ro = loadMessages('ro').Onboarding as Json
    expect(leafPaths(ro).sort()).toEqual(leafPaths(en).sort())
    expect(JSON.stringify(en) + JSON.stringify(ro)).not.toContain('—')
  })
})

describe('resolveSteps', () => {
  const steps = [
    { anchor: 'a', key: 'one' },
    { anchor: 'b', key: 'two' },
    { anchor: 'c', key: 'three' },
  ]

  it('keeps only steps whose anchor exists, in order', () => {
    expect(resolveSteps(steps, (anchor) => anchor !== 'b').map((s) => s.key)).toEqual(['one', 'three'])
  })

  it('returns an empty list when nothing exists', () => {
    expect(resolveSteps(steps, () => false)).toEqual([])
  })
})

describe('selectorFor', () => {
  it('targets the data-tour attribute', () => {
    expect(selectorFor('dashboard-sidebar')).toBe('[data-tour="dashboard-sidebar"]')
  })
})
