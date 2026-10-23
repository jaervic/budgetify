import { describe, expect, it } from 'vitest'
import { DEFAULT_CATALOG } from '@/data/catalog'
import {
  createEmptyQuote,
  DEFAULT_CLINIC,
  formatQuoteNumber,
} from '@/data/defaults'
import { DEFAULT_PRODUCTS } from '@/data/products'
import { HISTORY_LIMIT } from '@/lib/limits'
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

  it('conserva el historial de presupuestos guardados', () => {
    const state = migratePersisted({
      ...V5_STATE,
      history: [
        {
          id: 'saved_1',
          savedAt: '2026-10-13T18:30:00.000Z',
          budget: V5_STATE.budget,
        },
      ],
    })

    expect(state.history).toHaveLength(1)
    const [entry] = state.history
    expect(entry.kind).toBe('budget')
    if (entry.kind === 'budget') expect(entry.budget.patient.name).toBe('Ana Pérez')
  })

  it('sin historial guardado, arranca con una lista vacía', () => {
    expect(migratePersisted(V5_STATE).history).toEqual([])
  })

  it('descarta entradas de historial que no encajan con el modelo', () => {
    const state = migratePersisted({
      ...V5_STATE,
      history: [{ id: 'saved_1', cuando: 'ayer' }, 'no soy una entrada'],
    })

    expect(state.history).toEqual([])
  })

  it('recorta un historial pasado de tope', () => {
    const entrada = {
      id: 'saved_1',
      savedAt: '2026-10-13T18:30:00.000Z',
      budget: V5_STATE.budget,
    }
    const state = migratePersisted({
      ...V5_STATE,
      history: Array.from({ length: HISTORY_LIMIT + 10 }, (_, i) => ({
        ...entrada,
        id: `saved_${i}`,
      })),
    })

    // No se cargan 110 en memoria: el esquema rechaza el conjunto entero.
    expect(state.history).toEqual([])
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

  it('crea una cotización vacía y añade el catálogo de productos', () => {
    const state = migratePersisted(undefined)

    expect(state.docMode).toBe('budget')
    expect(state.quote.items).toEqual([])
    expect(state.quote.number).toBe(formatQuoteNumber(1))
    expect(state.quotePageSize).toBe('Letter')
    expect(state.quoteCounter).toBe(1)
    expect(state.catalog.products).toHaveLength(DEFAULT_PRODUCTS.length)
  })

  it('conserva la cotización guardada y su tamaño de hoja', () => {
    const quote = createEmptyQuote('000000042')
    quote.client.name = 'Cliente Guardado'
    quote.items.push({
      id: 'qi_1',
      code: 'A',
      description: 'Producto',
      qty: 2,
      unit: 'UND',
      unitPriceUsd: 5,
      taxRate: 16,
    })

    const state = migratePersisted({
      ...V5_STATE,
      docMode: 'quote',
      quote,
      quotePageSize: 'A4',
      quoteCounter: 42,
    })

    expect(state.docMode).toBe('quote')
    expect(state.quote.client.name).toBe('Cliente Guardado')
    expect(state.quote.items).toHaveLength(1)
    expect(state.quotePageSize).toBe('A4')
    expect(state.quoteCounter).toBe(42)
  })

  it('migra las copias antiguas del historial como presupuestos', () => {
    const state = migratePersisted({
      ...V5_STATE,
      history: [
        {
          id: 'saved_legacy',
          savedAt: '2026-10-13T18:30:00.000Z',
          budget: V5_STATE.budget,
        },
      ],
    })

    expect(state.history[0].kind).toBe('budget')
  })

  it('conserva una cotización dentro del historial', () => {
    const quote = createEmptyQuote('000000007')
    quote.client.name = 'Cliente Historial'
    const state = migratePersisted({
      ...V5_STATE,
      history: [
        {
          id: 'saved_quote',
          savedAt: '2026-10-13T18:30:00.000Z',
          kind: 'quote',
          quote,
        },
      ],
    })

    const [entry] = state.history
    expect(entry.kind).toBe('quote')
    if (entry.kind === 'quote') expect(entry.quote.client.name).toBe('Cliente Historial')
  })

  it('amplía un catálogo con los productos iniciales sin perder el precio editado', () => {
    const oldIds = [
      'prod_bata',
      'prod_cepillo',
      'prod_electrodo',
      'prod_gasa',
      'prod_guantes',
      'prod_cateter',
      'prod_hemostatico',
      'prod_seda',
    ]
    const oldProducts = oldIds.map((id) => {
      const product = DEFAULT_PRODUCTS.find((entry) => entry.id === id)
      if (!product) throw new Error(`Falta el producto inicial ${id}`)
      return { ...product, priceUsd: id === 'prod_gasa' ? 99 : product.priceUsd }
    })

    const state = migratePersisted({
      ...V5_STATE,
      catalog: { ...V5_STATE.catalog, products: oldProducts },
    })

    expect(state.catalog.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(state.catalog.products.find((p) => p.id === 'prod_gasa')?.priceUsd).toBe(99)
    expect(state.catalog.productCatalogVersion).toBe(2)
  })

  it('completa un catálogo v8 aunque ya tenga la versión de productos actual', () => {
    const oldIds = [
      'prod_bata',
      'prod_cepillo',
      'prod_electrodo',
      'prod_gasa',
      'prod_guantes',
      'prod_cateter',
      'prod_hemostatico',
      'prod_seda',
    ]
    const oldProducts = oldIds.map((id) => {
      const product = DEFAULT_PRODUCTS.find((entry) => entry.id === id)
      if (!product) throw new Error(`Falta el producto inicial ${id}`)
      return { ...product, priceUsd: id === 'prod_gasa' ? 99 : product.priceUsd }
    })

    const state = migratePersisted(
      {
        ...V5_STATE,
        catalog: {
          ...V5_STATE.catalog,
          products: oldProducts,
          productCatalogVersion: 2,
        },
      },
      8,
    )

    expect(state.catalog.products).toHaveLength(DEFAULT_PRODUCTS.length)
    expect(state.catalog.products.find((p) => p.id === 'prod_gasa')?.priceUsd).toBe(99)
  })

  it('no vuelve a añadir productos borrados al migrar una versión actual', () => {
    const kept = DEFAULT_PRODUCTS.slice(0, 3)

    const state = migratePersisted(
      {
        ...V5_STATE,
        catalog: {
          ...V5_STATE.catalog,
          products: kept,
          productCatalogVersion: 2,
        },
      },
      9,
    )

    expect(state.catalog.products).toHaveLength(3)
  })

  it('respeta un catálogo de productos vacío ya migrado', () => {
    const state = migratePersisted({
      ...V5_STATE,
      catalog: { ...V5_STATE.catalog, products: [] },
    })

    expect(state.catalog.products).toEqual([])
  })

  it('siembra los productos si el catálogo guardado no traía la lista', () => {
    const state = migratePersisted(V5_STATE)

    expect(state.catalog.products.length).toBe(DEFAULT_PRODUCTS.length)
  })

  it('cae en valores por defecto si la cotización guardada no es válida', () => {
    const state = migratePersisted({
      ...V5_STATE,
      quote: { number: 42, items: 'no' },
      quoteCounter: -5,
      quotePageSize: 'A9',
    })

    expect(state.quote.items).toEqual([])
    expect(state.quote.number).toBe(formatQuoteNumber(1))
    expect(state.quoteCounter).toBe(1)
    expect(state.quotePageSize).toBe('Letter')
  })
})
