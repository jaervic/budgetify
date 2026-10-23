import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloneDefaultClinic, createEmptyBcvCache, createEmptyQuote, DEFAULT_RATE } from '@/data/defaults'
import { formatUsd } from '@/lib/money'
import { computeQuote } from '@/lib/quoteCalc'
import { useBudgetStore } from './useBudgetStore'

function reset() {
  useBudgetStore.setState({
    quote: createEmptyQuote('000000001'),
    quoteCounter: 1,
    quotePageSize: 'Letter',
    docMode: 'budget',
    clinic: cloneDefaultClinic(),
    rateMode: 'auto',
    bcv: createEmptyBcvCache(),
    history: [],
  })
  useBudgetStore.getState().clearBudget()
  useBudgetStore.getState().resetCatalog()
  vi.unstubAllGlobals()
}

describe('store de cotizaciones', () => {
  beforeEach(reset)

  it('agrega productos del catálogo como líneas', () => {
    const [product] = useBudgetStore.getState().catalog.products
    useBudgetStore.getState().addQuoteProduct(product)

    const item = useBudgetStore.getState().quote.items[0]
    expect(item.sourceProductId).toBe(product.id)
    expect(item.code).toBe(product.code)
    expect(item.qty).toBe(1)
    expect(item.taxRate).toBe(product.taxRate)
  })

  it('agrega varios productos de una vez', () => {
    const products = useBudgetStore.getState().catalog.products.slice(0, 3)
    useBudgetStore.getState().addQuoteProducts(products)

    expect(useBudgetStore.getState().quote.items).toHaveLength(3)
  })

  it('cambia la moneda de la cotización y el modo de ambas monedas', () => {
    useBudgetStore.getState().setQuoteMeta({ currency: 'VES' })
    expect(useBudgetStore.getState().quote.currency).toBe('VES')

    useBudgetStore.getState().setQuoteMeta({ showBothCurrencies: true })
    expect(useBudgetStore.getState().quote.showBothCurrencies).toBe(true)

    useBudgetStore.getState().setQuoteMeta({ currency: 'USD' })
    expect(useBudgetStore.getState().quote.currency).toBe('USD')
  })

  it('crea una línea manual con IVA por defecto', () => {
    useBudgetStore.getState().addManualQuoteItem()

    const item = useBudgetStore.getState().quote.items[0]
    expect(item.description).toBe('Nuevo producto')
    expect(item.qty).toBe(1)
    expect(item.taxRate).toBe(16)
  })

  it('edita, duplica, mueve y elimina líneas', () => {
    const [first, second] = useBudgetStore.getState().catalog.products
    useBudgetStore.getState().addQuoteProducts([first, second])
    const items = useBudgetStore.getState().quote.items

    useBudgetStore.getState().updateQuoteItem(items[0].id, { qty: 3 })
    expect(useBudgetStore.getState().quote.items[0].qty).toBe(3)

    useBudgetStore.getState().duplicateQuoteItem(items[0].id)
    expect(useBudgetStore.getState().quote.items).toHaveLength(3)

    useBudgetStore.getState().moveQuoteItem(items[1].id, -1)
    expect(useBudgetStore.getState().quote.items[1].id).toBe(items[1].id)

    useBudgetStore.getState().removeQuoteItem(items[1].id)
    expect(
      useBudgetStore.getState().quote.items.some((item) => item.id === items[1].id),
    ).toBe(false)
  })

  it('calcula el total de la cotización en curso', () => {
    const product = useBudgetStore.getState().catalog.products.find((p) => p.id === 'prod_bata')!
    useBudgetStore.getState().addQuoteProduct(product)

    const items = useBudgetStore.getState().quote.items
    expect(formatUsd(computeQuote(items).totalUsd)).toBe('$7.89')
  })

  it('guarda y recupera una cotización del historial, cambiando de modalidad', () => {
    useBudgetStore.getState().setDocMode('quote')
    useBudgetStore.getState().setQuoteClient({ name: 'Cliente Prueba' })
    useBudgetStore.getState().addManualQuoteItem()
    useBudgetStore.getState().saveToHistory()

    const [entry] = useBudgetStore.getState().history
    expect(entry.kind).toBe('quote')
    const id = entry.id

    useBudgetStore.getState().clearQuote()
    useBudgetStore.setState({ docMode: 'budget' })

    expect(useBudgetStore.getState().loadSavedDocument(id)).toBe('quote')
    expect(useBudgetStore.getState().docMode).toBe('quote')
    expect(useBudgetStore.getState().quote.client.name).toBe('Cliente Prueba')
  })

  it('limpiar avanza el correlativo de cotización', () => {
    useBudgetStore.getState().clearQuote()

    expect(useBudgetStore.getState().quoteCounter).toBe(2)
    expect(useBudgetStore.getState().quote.number).toBe('000000002')
  })

  it('gestiona el catálogo de productos', () => {
    useBudgetStore.getState().addCatalogProduct({
      code: 'NEW',
      description: 'Producto nuevo',
      unit: 'UND',
      priceUsd: 12,
      taxRate: 8,
    })
    const created = useBudgetStore
      .getState()
      .catalog.products.find((product) => product.code === 'NEW')!
    expect(created).toBeDefined()

    useBudgetStore.getState().updateCatalogProduct(created.id, { priceUsd: 15 })
    expect(
      useBudgetStore.getState().catalog.products.find((p) => p.id === created.id)!.priceUsd,
    ).toBe(15)

    useBudgetStore.getState().removeCatalogProduct(created.id)
    expect(
      useBudgetStore.getState().catalog.products.some((p) => p.id === created.id),
    ).toBe(false)
  })

  it('la tasa BCV también actualiza la cotización cuando está anclada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ promedio: 950 }),
      }),
    )

    await useBudgetStore.getState().refreshBcvRate()

    expect(useBudgetStore.getState().quote.rate).toBe(950)
    expect(useBudgetStore.getState().budget.rate).toBe(950)
  })

  it('editar la tasa de la cotización pasa el modo a manual', () => {
    useBudgetStore.getState().setQuoteRate(1234.5)

    expect(useBudgetStore.getState().rateMode).toBe('manual')
    expect(useBudgetStore.getState().quote.rate).toBe(1234.5)
    expect(useBudgetStore.getState().budget.rate).toBe(DEFAULT_RATE)
  })

  it('al entrar en cotización con la tasa anclada usa el último BCV', () => {
    useBudgetStore.setState((state) => ({
      docMode: 'budget',
      rateMode: 'auto',
      bcv: { ...state.bcv, value: 950, status: 'ok' },
    }))

    useBudgetStore.getState().setDocMode('quote')

    expect(useBudgetStore.getState().docMode).toBe('quote')
    expect(useBudgetStore.getState().quote.rate).toBe(950)
  })
})
