import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CATALOG } from '@/data/catalog'
import { cloneDefaultClinic, createEmptyBcvCache, DEFAULT_RATE } from '@/data/defaults'
import { computeBudget } from '@/lib/calc'
import { HISTORY_LIMIT } from '@/lib/limits'
import { formatUsd } from '@/lib/money'
import { useBudgetStore } from './useBudgetStore'
import type { SavedDocument } from '@/types'

/** Extrae el presupuesto de una entrada del historial (falla si es cotización). */
function budgetOf(entry: SavedDocument | undefined) {
  if (!entry || entry.kind !== 'budget') throw new Error('Se esperaba un presupuesto')
  return entry.budget
}

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
      history: [],
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
      history: [],
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

  it('guarda una copia del presupuesto en el historial', () => {
    useBudgetStore.getState().setPatient({ name: 'Ana Pérez' })
    useBudgetStore.getState().addManualItem('Honorarios Médicos')

    const { saved, dropped } = useBudgetStore.getState().saveToHistory()

    expect(dropped).toBe(0)
    expect(budgetOf(saved).patient.name).toBe('Ana Pérez')
    expect(useBudgetStore.getState().history).toHaveLength(1)
  })

  it('la copia es independiente del borrador en curso', () => {
    useBudgetStore.getState().setPatient({ name: 'Ana Pérez' })
    useBudgetStore.getState().saveToHistory()

    useBudgetStore.getState().setPatient({ name: 'Otro paciente' })

    expect(budgetOf(useBudgetStore.getState().history[0]).patient.name).toBe('Ana Pérez')
    expect(useBudgetStore.getState().budget.patient.name).toBe('Otro paciente')
  })

  it('carga una copia y deja el presupuesto tal como se guardó', () => {
    useBudgetStore.getState().addManualItem('Honorarios Médicos')
    const item = useBudgetStore.getState().budget.items[0]
    useBudgetStore.getState().updateFormula(item.id, { type: 'fixed', amountUsd: 300 })
    useBudgetStore.getState().saveToHistory()
    const id = useBudgetStore.getState().history[0].id

    useBudgetStore.getState().clearBudget()
    expect(useBudgetStore.getState().budget.items).toHaveLength(0)

    expect(useBudgetStore.getState().loadSavedBudget(id)).toBe(true)
    const items = useBudgetStore.getState().budget.items
    expect(items).toHaveLength(1)
    expect(formatUsd(computeBudget(items).totalUsd)).toBe('$300.00')
  })

  it('avisa si la copia que se intenta cargar ya no existe', () => {
    expect(useBudgetStore.getState().loadSavedBudget('saved_inexistente')).toBe(false)
  })

  it('elimina una copia del historial', () => {
    useBudgetStore.getState().saveToHistory()
    const id = useBudgetStore.getState().history[0].id

    useBudgetStore.getState().removeSavedBudget(id)

    expect(useBudgetStore.getState().history).toHaveLength(0)
  })

  it('descarta las copias más antiguas al pasar del tope, y lo dice', () => {
    for (let i = 0; i < HISTORY_LIMIT + 3; i++) {
      useBudgetStore.getState().setPatient({ name: `Paciente ${i}` })
      const { dropped } = useBudgetStore.getState().saveToHistory()
      expect(dropped).toBe(i < HISTORY_LIMIT ? 0 : 1)
    }

    const history = useBudgetStore.getState().history
    expect(history).toHaveLength(HISTORY_LIMIT)
    // La última guardada va primera; las tres más antiguas se fueron.
    expect(budgetOf(history[0]).patient.name).toBe(`Paciente ${HISTORY_LIMIT + 2}`)
    expect(budgetOf(history.at(-1)).patient.name).toBe('Paciente 3')
  })
})
