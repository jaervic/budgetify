import { describe, expect, it } from 'vitest'
import { DEFAULT_CLINIC, DEFAULT_RATE, todayIso } from '@/data/defaults'
import { computeQuote } from './quoteCalc'
import { buildQuoteDocumentModel } from './quoteDocument'
import type { Quote, QuoteItem } from '@/types'

const ITEMS: QuoteItem[] = [
  {
    id: 'a',
    code: 'A-1',
    description: 'Producto de prueba',
    qty: 2,
    unit: 'UND',
    unitPriceUsd: 10,
    taxRate: 16,
  },
]

function quote(patch: Partial<Quote> = {}): Quote {
  return {
    number: '000000010',
    client: { name: 'Ana Pérez', rif: 'V-1234567' },
    currency: 'USD',
    showBothCurrencies: false,
    issueDate: todayIso(),
    rate: DEFAULT_RATE,
    items: ITEMS,
    ...patch,
  }
}

describe('modelo de la cotización', () => {
  it('formatea filas y totales', () => {
    const q = quote()
    const model = buildQuoteDocumentModel(q, computeQuote(q.items), DEFAULT_CLINIC, 'Letter')

    expect(model.rows).toHaveLength(1)
    expect(model.rows[0].code).toBe('A-1')
    expect(model.rows[0].qty).toBe('2')
    expect(model.rows[0].taxRate).toBe('16 %')
    expect(model.rows[0].unitPrice).toBe('$10.00')
    expect(model.rows[0].tax).toBe('$3.20')
    expect(model.rows[0].net).toBe('$23.20')
    expect(model.subtotal).toBe('$20.00')
    expect(model.taxTotal).toBe('$3.20')
    expect(model.total).toBe('$23.20')
    expect(model.priceColumnLabel).toBe('Precio USD')
    expect(model.totalOtherLabel).toBe('Total en bolívares')
    expect(model.totalOther).toContain('Bs.')
  })

  it('expresa los importes en bolívares cuando esa es la moneda', () => {
    const q = quote({ currency: 'VES' })
    const model = buildQuoteDocumentModel(q, computeQuote(q.items), DEFAULT_CLINIC, 'Letter')

    expect(model.currency).toBe('VES')
    expect(model.priceColumnLabel).toBe('Precio Bs.')
    expect(model.rows[0].unitPrice).toContain('Bs.')
    expect(model.rows[0].tax).toContain('Bs.')
    expect(model.rows[0].net).toContain('Bs.')
    expect(model.subtotal).toContain('Bs.')
    expect(model.taxTotal).toContain('Bs.')
    expect(model.total).toContain('Bs.')
    expect(model.totalOtherLabel).toBe('Total en dólares')
    expect(model.totalOther).toBe('$23.20')
  })

  it('incluye los importes en ambas monedas cuando se pide', () => {
    const q = quote({ showBothCurrencies: true })
    const model = buildQuoteDocumentModel(q, computeQuote(q.items), DEFAULT_CLINIC, 'Letter')

    expect(model.showBothCurrencies).toBe(true)
    expect(model.currencyDisplay).toBe('USD / VES')
    expect(model.priceColumnLabel).toBe('Precio')
    expect(model.rows[0].unitPriceOther).toContain('Bs.')
    expect(model.rows[0].taxOther).toContain('Bs.')
    expect(model.rows[0].netOther).toContain('Bs.')
    expect(model.subtotalOther).toContain('Bs.')
    expect(model.taxTotalOther).toContain('Bs.')
    expect(model.totalOther).toContain('Bs.')
  })

  it('omite los datos opcionales que están vacíos', () => {
    const q = quote({ seller: '   ', office: '', transport: undefined })
    const model = buildQuoteDocumentModel(q, computeQuote(q.items), DEFAULT_CLINIC, 'Letter')

    expect(model.seller).toBeUndefined()
    expect(model.office).toBeUndefined()
    expect(model.transport).toBeUndefined()
  })

  it('conserva los datos opcionales con valor', () => {
    const q = quote({
      seller: 'Luis',
      office: 'Principal',
      transport: 'Delivery',
      dueDate: todayIso(),
      purchaseOrder: 'OC-1',
      description: 'Entrega inmediata',
      terms: 'Pago a 30 días. Garantía de 6 meses.',
      client: {
        name: 'Ana Pérez',
        code: 'CL-01',
        rif: 'V-1',
        phones: '0414-0000000',
        address: 'Av. Principal',
      },
    })
    const model = buildQuoteDocumentModel(q, computeQuote(q.items), DEFAULT_CLINIC, 'Letter')

    expect(model.seller).toBe('Luis')
    expect(model.office).toBe('Principal')
    expect(model.transport).toBe('Delivery')
    expect(model.dueDate).toBeDefined()
    expect(model.purchaseOrder).toBe('OC-1')
    expect(model.description).toBe('Entrega inmediata')
    expect(model.terms).toBe('Pago a 30 días. Garantía de 6 meses.')
    expect(model.client.code).toBe('CL-01')
    expect(model.client.address).toBe('Av. Principal')
  })
})
