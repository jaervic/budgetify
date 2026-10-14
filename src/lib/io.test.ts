import { describe, expect, it } from 'vitest'
import { createEmptyBudget, DEFAULT_NOTES, DEFAULT_RATE, todayIso } from '@/data/defaults'
import { parseBudget, parseCatalog } from './io'

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
