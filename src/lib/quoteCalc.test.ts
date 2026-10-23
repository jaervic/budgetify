import { describe, expect, it } from 'vitest'
import { formatUsd } from './money'
import { computeQuote } from './quoteCalc'
import type { QuoteItem } from '@/types'

function item(patch: Partial<QuoteItem> = {}): QuoteItem {
  return {
    id: 'qi_1',
    code: 'A',
    description: 'Producto',
    qty: 1,
    unit: 'UND',
    unitPriceUsd: 10,
    taxRate: 16,
    ...patch,
  }
}

describe('cálculo de cotización', () => {
  it('calcula base, IVA y neto por línea', () => {
    const result = computeQuote([item({ qty: 2, unitPriceUsd: 10 })])

    expect(formatUsd(result.subtotalUsd)).toBe('$20.00')
    expect(formatUsd(result.taxUsd)).toBe('$3.20')
    expect(formatUsd(result.totalUsd)).toBe('$23.20')
    expect(formatUsd(result.items[0].netUsd)).toBe('$23.20')
  })

  it('redondea el IVA por línea antes de sumar', () => {
    // 0,72 × 16 % = 0,1152 → 0,12; 3,80 × 16 % = 0,608 → 0,61
    const result = computeQuote([
      item({ id: 'a', unitPriceUsd: 0.72 }),
      item({ id: 'b', unitPriceUsd: 3.8 }),
    ])

    expect(formatUsd(result.items[0].taxUsd)).toBe('$0.12')
    expect(formatUsd(result.items[1].taxUsd)).toBe('$0.61')
    expect(formatUsd(result.taxUsd)).toBe('$0.73')
    expect(formatUsd(result.totalUsd)).toBe('$5.25')
  })

  it('permite productos exentos de IVA', () => {
    const result = computeQuote([item({ taxRate: 0 })])

    expect(formatUsd(result.taxUsd)).toBe('$0.00')
    expect(formatUsd(result.totalUsd)).toBe('$10.00')
  })

  it('acepta cantidades decimales', () => {
    const result = computeQuote([item({ qty: 1.5, unitPriceUsd: 4 })])

    expect(formatUsd(result.subtotalUsd)).toBe('$6.00')
    expect(formatUsd(result.taxUsd)).toBe('$0.96')
    expect(formatUsd(result.totalUsd)).toBe('$6.96')
  })

  it('una cotización vacía da cero', () => {
    const result = computeQuote([])

    expect(result.items).toEqual([])
    expect(formatUsd(result.subtotalUsd)).toBe('$0.00')
    expect(formatUsd(result.taxUsd)).toBe('$0.00')
    expect(formatUsd(result.totalUsd)).toBe('$0.00')
  })
})
