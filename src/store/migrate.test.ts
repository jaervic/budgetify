import { describe, expect, it } from 'vitest'
import { DEFAULT_CATALOG } from '@/data/catalog'
import { DEFAULT_CLINIC } from '@/data/defaults'
import { migratePersisted } from './migrate'

/** Estado tal y como lo guardaba la v5: sin áreas ni modo de encabezado. */
const V5_STATE = {
  budget: {
    patient: { name: 'Ana Pérez', ci: 'V-123' },
    procedure: 'Cura de Prolapso',
    issueDate: '2026-10-13',
    rate: 900,
    items: [
      {
        id: 'item_1',
        category: 'Honorarios Médicos',
        concept: 'Cirujano Principal',
        formula: { type: 'fixed', amountUsd: 350 },
      },
    ],
    notes: ['Formas de Pago: Banco X'],
  },
  catalog: {
    categories: ['Honorarios Médicos', 'Mi categoría'],
    services: [
      {
        id: 'svc_cirujano',
        category: 'Honorarios Médicos',
        concept: 'Cirujano Principal',
        detail: 'Tarifa acordada',
        formula: { type: 'fixed', amountUsd: 999 },
      },
      {
        id: 'svc_mio',
        category: 'Mi categoría',
        concept: 'Servicio propio',
        formula: { type: 'fixed', amountUsd: 10 },
      },
    ],
    packs: [],
  },
  clinic: {
    name: 'Mi Clínica',
    rif: 'J-12345678-9',
    doctorName: 'Gregory House',
    doctorId: 'MPPS 12345',
    showSignature: true,
  },
  rateMode: 'manual',
  bcv: { value: 900, updatedAt: null, fetchedAt: null, status: 'ok', error: null },
  pageSize: 'Letter',
}

describe('migratePersisted', () => {
  it('conserva el borrador del usuario tal cual', () => {
    const state = migratePersisted(V5_STATE)

    expect(state.budget.patient.name).toBe('Ana Pérez')
    expect(state.budget.rate).toBe(900)
    expect(state.budget.items).toHaveLength(1)
    expect(state.rateMode).toBe('manual')
    expect(state.pageSize).toBe('Letter')
  })

  it('no pisa los precios editados y añade los servicios nuevos', () => {
    const state = migratePersisted(V5_STATE)
    const cirujano = state.catalog.services.find((s) => s.id === 'svc_cirujano')!

    expect(cirujano.formula).toEqual({ type: 'fixed', amountUsd: 999 })
    expect(state.catalog.services.length).toBeGreaterThan(2)
    expect(state.catalog.categories).toContain('Odontología · Endodoncia')
  })

  it('añade las áreas de práctica que faltaban', () => {
    const state = migratePersisted(V5_STATE)

    expect(state.catalog.specialties.map((s) => s.id)).toEqual(
      DEFAULT_CATALOG.specialties.map((s) => s.id),
    )
  })

  it('etiqueta con su área los servicios conocidos', () => {
    const state = migratePersisted(V5_STATE)

    expect(state.catalog.services.find((s) => s.id === 'svc_cirujano')!.specialtyId).toBe(
      'cirugia',
    )
    // Un servicio propio del usuario se queda sin área (transversal).
    expect(state.catalog.services.find((s) => s.id === 'svc_mio')!.specialtyId).toBe(
      undefined,
    )
  })

  it('un dato de clínica viejo sigue valiendo y usa el modo clínica', () => {
    const state = migratePersisted(V5_STATE)

    expect(state.clinic.name).toBe('Mi Clínica')
    expect(state.clinic.headerMode).toBe('clinic')
  })

  it('respeta el modo profesional si ya estaba guardado', () => {
    const state = migratePersisted({
      ...V5_STATE,
      clinic: {
        ...V5_STATE.clinic,
        headerMode: 'professional',
        doctorTitle: 'Dra.',
        specialtyId: 'odontologia',
      },
    })

    expect(state.clinic.headerMode).toBe('professional')
    expect(state.clinic.doctorTitle).toBe('Dra.')
    expect(state.clinic.specialtyId).toBe('odontologia')
  })

  it('cae en los valores por defecto si no hay nada guardado', () => {
    const state = migratePersisted(undefined)

    expect(state.budget.items).toEqual([])
    expect(state.catalog.services).toHaveLength(DEFAULT_CATALOG.services.length)
    expect(state.clinic).toEqual(DEFAULT_CLINIC)
    expect(state.rateMode).toBe('auto')
    expect(state.pageSize).toBe('A4')
    expect(state.bcv.status).toBe('idle')
  })

  it('descarta datos corruptos sin romper el arranque', () => {
    const state = migratePersisted({
      budget: { rate: 'no soy un número' },
      catalog: 'tampoco',
      clinic: { name: 42 },
      bcv: { status: 'loading' },
      pageSize: 'A9',
    })

    expect(state.budget.items).toEqual([])
    expect(state.catalog.services).toHaveLength(DEFAULT_CATALOG.services.length)
    expect(state.clinic).toEqual(DEFAULT_CLINIC)
    expect(state.pageSize).toBe('A4')
    // El estado "loading" nunca se restaura: quedaría colgado.
    expect(state.bcv.status).toBe('idle')
  })
})
