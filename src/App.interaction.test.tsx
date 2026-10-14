// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { cloneDefaultClinic } from '@/data/defaults'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useThemeStore } from '@/store/useThemeStore'

// jsdom no implementa algunas APIs que usan los componentes de Radix.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

function addManualLine() {
  return userEvent.click(screen.getByRole('button', { name: 'Añadir línea manual' }))
}

beforeEach(() => {
  useBudgetStore.getState().clearBudget()
  useBudgetStore.getState().resetCatalog()
  // Modo manual: evita que la app consulte el BCV al montar durante los tests.
  useBudgetStore.setState({ clinic: cloneDefaultClinic(), rateMode: 'manual' })
  useThemeStore.setState({ theme: 'system' })
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  // Red simulada, por si algo intenta consultar la tasa.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ promedio: 900 }),
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App · interacciones', () => {
  it('añade una línea manual al presupuesto', async () => {
    render(<App />)
    expect(screen.queryByLabelText('Concepto')).toBeNull()

    await addManualLine()

    const concept = screen.getByLabelText('Concepto') as HTMLInputElement
    expect(concept.value).toBe('Nuevo servicio')
    // La categoría aparece tanto en la cabecera del grupo como en los totales.
    expect(screen.getAllByText('Honorarios Médicos').length).toBeGreaterThan(0)
  })

  it('recalcula el total al editar un importe', async () => {
    render(<App />)
    await addManualLine()

    const amount = screen.getByLabelText('Monto en USD')
    await userEvent.clear(amount)
    await userEvent.type(amount, '100')

    expect(screen.getByTestId('total-usd').textContent).toBe('$100.00')
  })

  it('reagrupa la línea al cambiar su categoría', async () => {
    render(<App />)
    await addManualLine()

    const category = screen.getByLabelText('Categoría')
    await userEvent.clear(category)
    await userEvent.type(category, 'Gastos de Clínica')

    expect(screen.getAllByText('Gastos de Clínica').length).toBeGreaterThan(0)
    expect(screen.queryByText('Honorarios Médicos')).toBeNull()
  })

  it('alterna el tema claro/oscuro', async () => {
    render(<App />)
    const root = document.documentElement
    expect(root.classList.contains('dark')).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar tema' }))

    expect(root.classList.contains('dark')).toBe(true)
  })

  it('muestra la vista previa del documento con la clínica y el RIF', async () => {
    useBudgetStore.getState().setClinic({ name: 'Clínica Test', rif: 'J-12345678-9' })
    render(<App />)

    await userEvent.click(screen.getByRole('tab', { name: 'Vista previa' }))

    expect(screen.getByTestId('document-preview')).toBeTruthy()
    // Aparece en el encabezado y en el bloque de firma de la clínica.
    expect(screen.getAllByText('Clínica Test').length).toBeGreaterThan(0)
    expect(screen.getByText('RIF:J-12345678-9')).toBeTruthy()
  })
})
