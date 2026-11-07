import { describe, it, expect } from 'vitest'
import type { TextItem } from 'pdfjs-dist/types/src/display/api'
import { itemsToText, mergeSpacedLetters } from '@/lib/pdf-text-extract'

function item(str: string, x: number, y: number, width: number, hasEOL = false, dir: 'ltr' | 'rtl' = 'ltr'): TextItem {
  return { str, transform: [10, 0, 0, 10, x, y], width, height: 10, hasEOL, dir, fontName: 'f' }
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

  it('keeps the word gap between consecutive right-to-left items', () => {
    // Each next item sits further left; the second starts 10 units left of the first item's left edge.
    const text = itemsToText([item('שלום', 200, 700, 30, false, 'rtl'), item('עולם', 150, 700, 40, false, 'rtl')])
    expect(text).toBe('שלום עולם')
  })

  it('does not insert a space between touching right-to-left items', () => {
    const text = itemsToText([item('של', 200, 700, 15, false, 'rtl'), item('ום', 185, 700, 15, false, 'rtl')])
    expect(text).toBe('שלום')
  })
})

describe('mergeSpacedLetters', () => {
  it('merges runs of single spaced letters', () => {
    expect(mergeSpacedLetters('E D U C A T I O N\nSales Associate')).toBe('EDUCATION\nSales Associate')
  })

  it('splits a spaced-letter run at a lowercase to uppercase change', () => {
    expect(mergeSpacedLetters('S a l e s A s s o c i a t e')).toBe('Sales Associate')
    expect(mergeSpacedLetters('S k i l l s W o r k')).toBe('Skills Work')
  })

  it('keeps an all-caps run as one word', () => {
    expect(mergeSpacedLetters('W O R K')).toBe('WORK')
  })

  it('leaves normal text and short letter runs alone', () => {
    expect(mergeSpacedLetters('Plan A B or C, 2024 - 2026')).toBe('Plan A B or C, 2024 - 2026')
  })
})
