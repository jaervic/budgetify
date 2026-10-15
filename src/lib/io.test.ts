import { describe, expect, it } from 'vitest'
import { createEmptyBudget, DEFAULT_NOTES, DEFAULT_RATE, todayIso } from '@/data/defaults'
import { parseBudget, parseCatalog, clinicSchema } from './io'

describe('validación de importación', () => {
  it('acepta un presupuesto generado por la propia app', () => {
    const budget = createEmptyBudget()
    expect(() => parseBudget(budget)).not.toThrow()
  })

  it('rechaza una tasa inválida', () => {
    const budget = createEmptyBudget()
    budget.rate = 0
    expect(() => parseBudget(budget)).toThrow()
  })

  it('rechaza una fórmula desconocida', () => {
    const budget = createEmptyBudget()
    // @ts-expect-error probamos un JSON corrupto a propósito
    budget.items.push({ id: 'x', category: 'C', concept: 'X', formula: { type: 'nope' } })
    expect(() => parseBudget(budget)).toThrow()
  })

  it('rechaza un objeto que no es un presupuesto', () => {
    expect(() => parseBudget({ hello: 'world' })).toThrow()
  })

  it('valida un catálogo', () => {
    expect(() =>
      parseCatalog({
        categories: ['A'],
        services: [
          { id: 's', category: 'A', concept: 'Servicio', formula: { type: 'fixed', amountUsd: 1 } },
        ],
        packs: [{ id: 'p', name: 'Pack', services: [{ serviceId: 's' }] }],
      }),
    ).not.toThrow()
  })

  it('expone la tasa y las notas por defecto', () => {
    expect(DEFAULT_RATE).toBe(876.8)
    expect(DEFAULT_NOTES.length).toBeGreaterThan(0)
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('validación endurecida (seguridad)', () => {
  const PNG = 'data:image/png;base64,iVBORw0KGgo='
  const CLINIC = { name: 'Clínica', rif: 'J-1' }

  it('acepta un logo PNG válido', () => {
    expect(() => clinicSchema.parse({ ...CLINIC, logoDataUrl: PNG })).not.toThrow()
  })

  it('rechaza un logo que no sea imagen', () => {
    expect(() =>
      clinicSchema.parse({ ...CLINIC, logoDataUrl: 'javascript:alert(1)' }),
    ).toThrow()
    expect(() =>
      clinicSchema.parse({ ...CLINIC, logoDataUrl: 'data:text/html;base64,PHNjcmlwdD4=' }),
    ).toThrow()
    expect(() => clinicSchema.parse({ ...CLINIC, logoDataUrl: 'https://malo.com/x.png' })).toThrow()
  })

  it('rechaza una imagen demasiado grande', () => {
    const huge = `data:image/png;base64,${'A'.repeat(3_000_001)}`
    expect(() => clinicSchema.parse({ ...CLINIC, logoDataUrl: huge })).toThrow(/demasiado grande/)
  })

  it('rechaza una fecha de emisión con formato inválido', () => {
    const budget = createEmptyBudget()
    budget.issueDate = '14/10/2026'
    expect(() => parseBudget(budget)).toThrow(/Fecha inválida/)
  })

  it('rechaza un número excesivo de ítems', () => {
    const budget = createEmptyBudget()
    budget.items = Array.from({ length: 501 }, (_, index) => ({
      id: `i${index}`,
      category: 'A',
      concept: 'X',
      formula: { type: 'fixed' as const, amountUsd: 1 },
    }))
    expect(() => parseBudget(budget)).toThrow()
  })

  it('rechaza una tasa fuera de rango', () => {
    const budget = createEmptyBudget()
    budget.rate = 10_000_000
    expect(() => parseBudget(budget)).toThrow()
  })

  it('acepta el presupuesto por defecto intacto', () => {
    expect(() => parseBudget(createEmptyBudget())).not.toThrow()
    expect(parseBudget(createEmptyBudget()).items).toEqual([])
  })
})
