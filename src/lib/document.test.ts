import { describe, expect, it } from 'vitest'
import { DEFAULT_CLINIC } from '@/data/defaults'
import type { Budget, Clinic, Item } from '@/types'
import { computeBudget } from './calc'
import { buildDocumentModel, PAGE_DIMENSIONS } from './document'

const CLINIC: Clinic = {
  ...DEFAULT_CLINIC,
  name: 'Clínica Test',
  rif: 'J-12345678-9',
  doctorName: 'Dr. Gregory House',
  doctorId: 'MPPS 12345',
}

const ITEMS: Item[] = [
  {
    id: 'a',
    category: 'Gastos de Clínica',
    concept: 'Circulantes',
    detail: 'Asistencia en quirófano',
    formula: { type: 'qty_unit', qty: 2, unitUsd: 20 },
  },
  {
    id: 'b',
    category: 'Honorarios Médicos',
    concept: 'Cirujano Principal',
    detail: 'Tarifa base acordada',
    formula: { type: 'fixed', amountUsd: 350 },
  },
]

const BUDGET: Budget = {
  patient: { name: 'Ana Pérez', ci: 'V-1234567', age: 70 },
  procedure: 'Cura de Prolapso',
  issueDate: '2026-10-13',
  rate: 876.8,
  items: ITEMS,
  notes: ['Formas de Pago: Banco X', 'Nota sin etiqueta'],
}

describe('buildDocumentModel', () => {
  const model = buildDocumentModel(BUDGET, computeBudget(ITEMS), CLINIC, {
    rateMode: 'auto',
    pageSize: 'A4',
  })

  it('formatea la fecha en formato largo', () => {
    expect(model.issueDate).toBe('13 de Octubre de 2026')
  })

  it('incluye el procedimiento', () => {
    expect(model.procedure).toBe('Cura de Prolapso')
  })

  it('marca la tasa como BCV cuando el modo es automático', () => {
    expect(model.rateLabel).toBe('876,80 VES/USD (BCV)')
  })

  it('numera y pone en mayúsculas las categorías en orden de aparición', () => {
    expect(model.sections.map((s) => [s.index, s.title])).toEqual([
      [1, 'GASTOS DE CLÍNICA'],
      [2, 'HONORARIOS MÉDICOS'],
    ])
  })

  it('añade la cantidad al concepto y el unitario al detalle', () => {
    const row = model.sections[0].rows[0]
    expect(row.concept).toBe('Circulantes (2)')
    expect(row.detail).toBe('Asistencia en quirófano ($20.00 c/u)')
  })

  it('separa las notas en etiqueta y cuerpo', () => {
    expect(model.notes[0]).toEqual({ label: 'Formas de Pago', body: 'Banco X' })
    expect(model.notes[1]).toEqual({ label: '', body: 'Nota sin etiqueta' })
  })

  it('genera los bloques de firma del médico y de la clínica', () => {
    expect(model.signatures.map((s) => s.label)).toEqual([
      'Firma y Sello del Médico Tratante',
      'Firma y Sello de la Clínica',
    ])
    expect(model.signatures[0].name).toBe('Dr. Gregory House')
    expect(model.signatures[0].extra).toBe('MPPS 12345')
    expect(model.signatures[1].extra).toBe('RIF: J-12345678-9')
  })

  it('omite las firmas si se desactivan', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      { ...CLINIC, showSignature: false },
      { rateMode: 'manual', pageSize: 'A4' },
    )
    expect(model.signatures).toEqual([])
  })

  it('no marca (BCV) en modo manual y respeta el tamaño de hoja', () => {
    const model = buildDocumentModel(BUDGET, computeBudget(ITEMS), CLINIC, {
      rateMode: 'manual',
      pageSize: 'Legal',
    })
    expect(model.rateLabel).toBe('876,80 VES/USD')
    expect(model.pageSize).toBe('Legal')
  })

  it('expone las dimensiones de cada tamaño de hoja', () => {
    expect(PAGE_DIMENSIONS.A4.width).toBeLessThan(PAGE_DIMENSIONS.A4.height)
    expect(PAGE_DIMENSIONS.Legal.height).toBeGreaterThan(PAGE_DIMENSIONS.Letter.height)
  })
})

describe('encabezado del documento', () => {
  it('en modo clínica encabeza el nombre de la clínica, sin área', () => {
    const model = buildDocumentModel(BUDGET, computeBudget(ITEMS), CLINIC, {
      rateMode: 'auto',
      pageSize: 'A4',
    })
    expect(model.headerTitle).toBe('Clínica Test')
    expect(model.headerSubtitle).toBeUndefined()
  })

  it('en modo profesional encabeza el nombre con su título y su área', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      {
        ...CLINIC,
        headerMode: 'professional',
        doctorTitle: 'Od.',
        doctorName: 'Ana Rojas',
        specialtyId: 'odontologia',
      },
      { rateMode: 'auto', pageSize: 'A4' },
    )
    expect(model.headerTitle).toBe('Od. Ana Rojas')
    expect(model.headerSubtitle).toBe('Odontología')
  })

  it('usa el nombre del área que le pasa la app, no solo las de fábrica', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      { ...CLINIC, headerMode: 'professional', doctorName: 'Ana Rojas', specialtyId: 'x' },
      { rateMode: 'auto', pageSize: 'A4', specialtyName: 'Área personalizada' },
    )
    expect(model.headerSubtitle).toBe('Área personalizada')
  })

  it('sin nombre de profesional cae en el nombre de la clínica', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      { ...CLINIC, headerMode: 'professional', doctorTitle: '', doctorName: '' },
      { rateMode: 'auto', pageSize: 'A4' },
    )
    expect(model.headerTitle).toBe('Clínica Test')
  })

  it('en modo profesional sin clínica propia solo firma el profesional', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      { ...DEFAULT_CLINIC, headerMode: 'professional', doctorName: 'Ana Rojas' },
      { rateMode: 'auto', pageSize: 'A4' },
    )
    expect(model.signatures.map((s) => s.label)).toEqual([
      'Firma y Sello del Médico Tratante',
    ])
  })

  it('en modo profesional con clínica propia firman los dos', () => {
    const model = buildDocumentModel(
      BUDGET,
      computeBudget(ITEMS),
      { ...CLINIC, headerMode: 'professional', doctorName: 'Ana Rojas' },
      { rateMode: 'auto', pageSize: 'A4' },
    )
    expect(model.signatures.map((s) => s.label)).toEqual([
      'Firma y Sello del Médico Tratante',
      'Firma y Sello de la Clínica',
    ])
  })
})
