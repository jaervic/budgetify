import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CATALOG } from '@/data/catalog'
import { cloneDefaultClinic, createEmptyBcvCache, DEFAULT_RATE } from '@/data/defaults'
import { computeBudget } from '@/lib/calc'
import { formatUsd } from '@/lib/money'
import { useBudgetStore } from './useBudgetStore'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response
}

/** Integración: catálogo → pack → ítems del presupuesto → total. */
describe('store del presupuesto', () => {
  beforeEach(() => {
    useBudgetStore.getState().clearBudget()
    useBudgetStore.getState().resetCatalog()
    useBudgetStore.setState({
      clinic: cloneDefaultClinic(),
      rateMode: 'auto',
      bcv: createEmptyBcvCache(),
    })
    vi.unstubAllGlobals()
  })

  it('carga el pack de cirugía y produce el total esperado', () => {
    const pack = DEFAULT_CATALOG.packs[0]
    useBudgetStore.getState().addServicesFromPack(pack, 'replace')

    const items = useBudgetStore.getState().budget.items
    expect(items).toHaveLength(pack.services.length)
    expect(formatUsd(computeBudget(items).totalUsd)).toBe('$1,375.00')
  })

  it('editar un precio del presupuesto no toca el catálogo', () => {
    const service = useBudgetStore
      .getState()
      .catalog.services.find((s) => s.id === 'svc_cirujano')!
    useBudgetStore.getState().addService(service)

    const item = useBudgetStore.getState().budget.items[0]
    useBudgetStore.getState().updateFormula(item.id, { type: 'fixed', amountUsd: 500 })

    const catalogPrice = useBudgetStore
      .getState()
      .catalog.services.find((s) => s.id === 'svc_cirujano')!
    expect(catalogPrice.formula).toEqual({ type: 'fixed', amountUsd: 350 })
    expect(useBudgetStore.getState().budget.items[0].formula).toEqual({
      type: 'fixed',
      amountUsd: 500,
    })
  })

  it('sincroniza las tarifas editadas hacia el catálogo', () => {
    const service = useBudgetStore
      .getState()
      .catalog.services.find((s) => s.id === 'svc_cirujano')!
    useBudgetStore.getState().addService(service)

    const item = useBudgetStore.getState().budget.items[0]
    useBudgetStore.getState().updateFormula(item.id, { type: 'fixed', amountUsd: 420 })

    const updated = useBudgetStore.getState().syncPricesToCatalog()
    expect(updated).toBe(1)
    expect(
      useBudgetStore.getState().catalog.services.find((s) => s.id === 'svc_cirujano')!.formula,
    ).toEqual({ type: 'fixed', amountUsd: 420 })
  })

  it('limpiar deja un presupuesto vacío', () => {
    useBudgetStore.getState().addService(useBudgetStore.getState().catalog.services[0])
    useBudgetStore.getState().clearBudget()
    expect(useBudgetStore.getState().budget).toEqual(
      expect.objectContaining({ items: [], patient: { name: '' } }),
    )
  })
})

describe('tasa BCV y datos de la clínica', () => {
  beforeEach(() => {
    useBudgetStore.getState().clearBudget()
    useBudgetStore.setState({
      clinic: cloneDefaultClinic(),
      rateMode: 'auto',
      bcv: createEmptyBcvCache(),
    })
    vi.unstubAllGlobals()
  })

  it('aplica la tasa del BCV cuando el modo es auto', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ promedio: 900, fechaActualizacion: '2026-10-14T00:00:00-04:00' }),
      ),
    )

    await useBudgetStore.getState().refreshBcvRate()

    const state = useBudgetStore.getState()
    expect(state.bcv.status).toBe('ok')
    expect(state.bcv.value).toBe(900)
    expect(state.budget.rate).toBe(900)
  })

  it('consulta el BCV pero no aplica el valor en modo manual', async () => {
    useBudgetStore.setState({ rateMode: 'manual' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ promedio: 900 })))

    await useBudgetStore.getState().refreshBcvRate()

    expect(useBudgetStore.getState().bcv.value).toBe(900)
    expect(useBudgetStore.getState().budget.rate).toBe(DEFAULT_RATE)
  })

  it('editar la tasa a mano pasa el modo a manual', () => {
    expect(useBudgetStore.getState().rateMode).toBe('auto')
    useBudgetStore.getState().setRate(1234.5)
    expect(useBudgetStore.getState().rateMode).toBe('manual')
    expect(useBudgetStore.getState().budget.rate).toBe(1234.5)
  })

  it('deja un error legible si el BCV falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')))

    await useBudgetStore.getState().refreshBcvRate()

    const state = useBudgetStore.getState()
    expect(state.bcv.status).toBe('error')
    expect(state.bcv.error).toBe('sin conexión')
  })

  it('guardar el modo auto aplica el último valor conocido sin volver a consultar', () => {
    useBudgetStore.setState({ rateMode: 'manual', budget: { ...useBudgetStore.getState().budget, rate: 1 } })
    useBudgetStore.setState((state) => ({ bcv: { ...state.bcv, value: 950, status: 'ok' } }))

    useBudgetStore.getState().setRateMode('auto')

    expect(useBudgetStore.getState().rateMode).toBe('auto')
    expect(useBudgetStore.getState().budget.rate).toBe(950)
  })

  it('guarda los datos de la clínica', () => {
    useBudgetStore.getState().setClinic({ name: 'Clínica Test', rif: 'J-12345678-9' })
    expect(useBudgetStore.getState().clinic.name).toBe('Clínica Test')
    expect(useBudgetStore.getState().clinic.rif).toBe('J-12345678-9')

    useBudgetStore.getState().setClinic({ logoDataUrl: 'data:image/png;base64,AAA' })
    expect(useBudgetStore.getState().clinic.logoDataUrl).toContain('data:image/png')

    useBudgetStore.getState().clearClinicLogo()
    expect(useBudgetStore.getState().clinic.logoDataUrl).toBeUndefined()
  })
})
