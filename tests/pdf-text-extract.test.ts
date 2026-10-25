import { describe, it, expect } from 'vitest'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { itemsToText, mergeSpacedLetters } from '@/lib/pdf-text-extract'

function item(str: string, x: number, y: number, width: number, hasEOL = false): TextItem {
  return { str, transform: [10, 0, 0, 10, x, y], width, height: 10, hasEOL, dir: 'ltr', fontName: 'f' }
}

describe('itemsToText', () => {
  it('joins one-item-per-glyph headings without inserting spaces', () => {
    const glyphs = [...'EDUCATION'].map((ch, i) => item(ch, 50 + i * 7, 700, 7))
    expect(itemsToText(glyphs)).toBe('EDUCATION')
  })

  it('keeps word gaps and line breaks', () => {
    const text = itemsToText([
      item('Sales', 50, 700, 25),
      item('Associate', 85, 700, 45),
      item('Store', 50, 680, 25),
    ])
    expect(text).toBe('Sales Associate\nStore')
  })

  it('honors hasEOL without doubling the newline', () => {
    expect(itemsToText([item('One', 50, 700, 20, true), item('Two', 50, 680, 20)])).toBe('One\nTwo')
  })
})

describe('mergeSpacedLetters', () => {
  it('merges runs of single spaced letters', () => {
    expect(mergeSpacedLetters('E D U C A T I O N\nSales Associate')).toBe('EDUCATION\nSales Associate')
  })

  it('leaves normal text and short letter runs alone', () => {
    expect(mergeSpacedLetters('Plan A B or C, 2024 - 2026')).toBe('Plan A B or C, 2024 - 2026')
  })
})
