import { describe, expect, it } from 'vitest'
import type { Item } from '@/types'
import { computeBudget } from './calc'
import { formatUsd, formatVes, usdToVes } from './money'

/**
 * Fixture con los importes obligatorios de la especificación (tasa 876,80).
 * Se definen aquí a propósito para que el motor de cálculo se valide contra
 * esos números aunque el catálogo por defecto cambie.
 */
const SPEC_ITEMS: Item[] = [
  {
    id: 'i1',
    category: 'Honorarios Médicos',
    concept: 'Cirujano Principal',
    detail: 'Tarifa base acordada',
    formula: { type: 'fixed', amountUsd: 350 },
  },
  {
    id: 'i2',
    category: 'Honorarios Médicos',
    concept: 'Ayudante y Anestesiólogo',
    detail: '50% de honorarios principales',
    formula: { type: 'percent_of_item', refConcept: 'Cirujano Principal', percent: 50 },
  },
  {
    id: 'i3',
    category: 'Honorarios Médicos',
    concept: 'Interconsulta',
    detail: 'Cobertura de 24 horas',
    formula: { type: 'fixed', amountUsd: 70 },
  },
  {
    id: 'i4',
    category: 'Honorarios Médicos',
    concept: 'Residente',
    detail: 'Elaboración de historia clínica',
    formula: { type: 'fixed', amountUsd: 20 },
  },
  {
    id: 'i5',
    category: 'Gastos de Clínica',
    concept: 'Circulantes',
    detail: 'Asistencia en quirófano',
    formula: { type: 'qty_unit', qty: 2, unitUsd: 20 },
  },
  {
    id: 'i6',
    category: 'Gastos de Clínica',
    concept: 'Instrumentista',
    detail: 'Tarifa estándar por turno',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'i7',
    category: 'Gastos de Clínica',
    concept: 'Derecho de Quirófano',
    detail: 'Estimado base por 2 horas',
    formula: { type: 'fixed', amountUsd: 180 },
  },
  {
    id: 'i8',
    category: 'Gastos de Clínica',
    concept: 'Monitoreo y Electrocuaterio',
    detail: 'Uso de equipos especiales',
    formula: { type: 'fixed', amountUsd: 60 },
  },
  {
    id: 'i9',
    category: 'Gastos de Clínica',
    concept: 'Material Médico Quirúrgico',
    detail: 'Kits, suturas, descartables',
    formula: { type: 'fixed', amountUsd: 250 },
  },
  {
    id: 'i10',
    category: 'Gastos de Clínica',
    concept: 'Hospitalización',
    detail: 'Habitación estándar (24 horas)',
    formula: { type: 'fixed', amountUsd: 90 },
  },
  {
    id: 'i11',
    category: 'Gastos de Clínica',
    concept: 'Asistencia Permanente Enf.',
    detail: 'Turnos rotativos (24h)',
    formula: { type: 'fixed', amountUsd: 40 },
  },
  {
    id: 'i12',
    category: 'Gastos de Clínica',
    concept: 'Historias Clínicas y Desechos',
    detail: 'Papelería y manejo patológico',
    formula: { type: 'fixed', amountUsd: 25 },
  },
  {
    id: 'i13',
    category: 'Gastos de Clínica',
    concept: 'Gastos de Administración',
    detail: 'Porcentaje sobre uso clínico',
    formula: { type: 'fixed', amountUsd: 35 },
  },
]

const RATE = 876.8

function amountOf(items: Item[], concept: string) {
  const result = computeBudget(items)
  const found = result.items.find((item) => item.concept === concept)
  if (!found) throw new Error(`Ítem no encontrado: ${concept}`)
  return found.amountUsd
}

describe('cálculos con tasa 876,80 (ejemplos obligatorios de la spec)', () => {
  const items = SPEC_ITEMS

  it('Cirujano Principal $350 → Bs. 306.880,00', () => {
    const usd = amountOf(items, 'Cirujano Principal')
    expect(formatUsd(usd)).toBe('$350.00')
    expect(formatVes(usdToVes(usd, RATE))).toBe('Bs. 306.880,00')
  })

  it('Ayudante y Anestesiólogo 50% de $350 = $175 → Bs. 153.440,00', () => {
    const usd = amountOf(items, 'Ayudante y Anestesiólogo')
    expect(formatUsd(usd)).toBe('$175.00')
    expect(formatVes(usdToVes(usd, RATE))).toBe('Bs. 153.440,00')
  })

  it('Circulantes 2 × $20 = $40 → Bs. 35.072,00', () => {
    const usd = amountOf(items, 'Circulantes')
    expect(formatUsd(usd)).toBe('$40.00')
    expect(formatVes(usdToVes(usd, RATE))).toBe('Bs. 35.072,00')
  })

  it('Subtotal Honorarios $615 → Bs. 539.232,00', () => {
    const { subtotals } = computeBudget(items)
    const honorarios = subtotals.find((s) => s.category === 'Honorarios Médicos')
    expect(honorarios).toBeDefined()
    expect(formatUsd(honorarios!.amountUsd)).toBe('$615.00')
    expect(formatVes(usdToVes(honorarios!.amountUsd, RATE))).toBe('Bs. 539.232,00')
  })

  it('Subtotal Gastos de Clínica $760 → Bs. 666.368,00', () => {
    const { subtotals } = computeBudget(items)
    const gastos = subtotals.find((s) => s.category === 'Gastos de Clínica')
    expect(gastos).toBeDefined()
    expect(formatUsd(gastos!.amountUsd)).toBe('$760.00')
    expect(formatVes(usdToVes(gastos!.amountUsd, RATE))).toBe('Bs. 666.368,00')
  })

  it('TOTAL $1.375 → Bs. 1.205.600,00', () => {
    const { totalUsd } = computeBudget(items)
    expect(formatUsd(totalUsd)).toBe('$1,375.00')
    expect(formatVes(usdToVes(totalUsd, RATE))).toBe('Bs. 1.205.600,00')
  })

  it('no redondea en pasos intermedios', () => {
    // 1/3 de 100 = 33.333... → al mostrar $33.33, pero el acumulado conserva precisión.
    const items: Item[] = [
      { id: 'a', category: 'C', concept: 'Base', formula: { type: 'fixed', amountUsd: 100 } },
      {
        id: 'b',
        category: 'C',
        concept: 'Tercio',
        formula: { type: 'percent_of_item', refConcept: 'Base', percent: 33.3333333333 },
      },
    ]
    const { totalUsd } = computeBudget(items)
    expect(formatUsd(totalUsd)).toBe('$133.33')
    expect(totalUsd.toFixed(6)).toBe('133.333333')
  })
})

describe('percent_of_subtotal', () => {
  it('calcula sobre la categoría excluyéndose a sí mismo', () => {
    const items: Item[] = [
      { id: 'a', category: 'Clínica', concept: 'A', formula: { type: 'fixed', amountUsd: 700 } },
      { id: 'b', category: 'Clínica', concept: 'B', formula: { type: 'fixed', amountUsd: 25 } },
      {
        id: 'c',
        category: 'Clínica',
        concept: 'Admin',
        formula: { type: 'percent_of_subtotal', category: 'Clínica', percent: 5 },
      },
    ]
    const { subtotals, totalUsd } = computeBudget(items)
    // base = 700 + 25 = 725; admin = 5% de 725 = 36.25
    expect(formatUsd(subtotals[0].amountUsd)).toBe('$761.25')
    expect(formatUsd(totalUsd)).toBe('$761.25')
  })
})

describe('casos límite', () => {
  it('reporta referencias inexistentes sin romper', () => {
    const items: Item[] = [
      {
        id: 'a',
        category: 'C',
        concept: 'Derivado',
        formula: { type: 'percent_of_item', refConcept: 'NoExiste', percent: 10 },
      },
    ]
    const result = computeBudget(items)
    expect(result.items[0].amountUsd.toNumber()).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.totalUsd.toNumber()).toBe(0)
  })

  it('detecta dependencias circulares', () => {
    const items: Item[] = [
      {
        id: 'a',
        category: 'C',
        concept: 'A',
        formula: { type: 'percent_of_item', refConcept: 'B', percent: 50 },
      },
      {
        id: 'b',
        category: 'C',
        concept: 'B',
        formula: { type: 'percent_of_item', refConcept: 'A', percent: 50 },
      },
    ]
    const result = computeBudget(items)
    expect(result.errors.some((error) => error.includes('circular'))).toBe(true)
  })

  it('respeta el orden de aparición de las categorías', () => {
    const items: Item[] = [
      { id: 'a', category: 'Z', concept: 'A', formula: { type: 'fixed', amountUsd: 1 } },
      { id: 'b', category: 'A', concept: 'B', formula: { type: 'fixed', amountUsd: 1 } },
    ]
    const { subtotals } = computeBudget(items)
    expect(subtotals.map((s) => s.category)).toEqual(['Z', 'A'])
  })
})

describe('formato de moneda', () => {
  it('formatea USD con dos decimales y separador de miles', () => {
    expect(formatUsd(1375)).toBe('$1,375.00')
    expect(formatUsd(350)).toBe('$350.00')
  })

  it('formatea VES con estilo es-VE', () => {
    expect(formatVes(1205600)).toBe('Bs. 1.205.600,00')
  })
})
