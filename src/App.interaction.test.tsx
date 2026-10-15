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
// jsdom tampoco implementa la captura de punteros que usa el gesto de descartar
// de sonner (los avisos con acción "Deshacer" lo activan).
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
}
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

  it('muestra el número interpretado al salir del campo', async () => {
    render(<App />)
    await addManualLine()

    const amount = screen.getByLabelText('Monto en USD') as HTMLInputElement
    await userEvent.clear(amount)
    await userEvent.type(amount, '1.234')
    await userEvent.tab()

    // "1.234" son mil doscientos treinta y cuatro, y el campo lo deja claro.
    expect(amount.value).toBe('1.234,00')
    expect(screen.getByTestId('total-usd').textContent).toBe('$1,234.00')
  })

  it('guarda el procedimiento aunque falte el nombre del paciente', async () => {
    render(<App />)
    // El presupuesto arranca sin nombre: antes eso bloqueaba TODO el guardado.
    await userEvent.type(screen.getByLabelText('Procedimiento'), 'Colecistectomía')

    expect(useBudgetStore.getState().budget.procedure).toBe('Colecistectomía')

    // Y la hoja dice lo mismo que el formulario.
    await userEvent.click(screen.getByRole('tab', { name: 'Vista previa' }))
    expect(screen.getByTestId('document-preview').textContent).toContain('Colecistectomía')
  })

  it('no descarta los cambios posteriores al vaciar el nombre', async () => {
    render(<App />)
    const name = screen.getByLabelText('Paciente')
    const procedure = screen.getByLabelText('Procedimiento')

    await userEvent.type(name, 'Ana Pérez')
    await userEvent.type(procedure, 'Uno')
    await userEvent.clear(name)
    await userEvent.type(procedure, ' y dos')

    expect(useBudgetStore.getState().budget.patient.name).toBe('')
    expect(useBudgetStore.getState().budget.procedure).toBe('Uno y dos')
  })

  it('pide confirmación antes de limpiar y ofrece deshacer', async () => {
    render(<App />)
    await addManualLine()

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    // Abrir el diálogo todavía no borra nada.
    expect(useBudgetStore.getState().budget.items).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Limpiar presupuesto' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(1)
  })

  it('elimina un servicio y permite deshacer', async () => {
    render(<App />)
    await addManualLine()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(1)
    expect(useBudgetStore.getState().budget.items[0].concept).toBe('Nuevo servicio')
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

  it('encabeza la hoja con el profesional en modo independiente', async () => {
    useBudgetStore.getState().setClinic({
      headerMode: 'professional',
      doctorTitle: 'Od.',
      doctorName: 'Ana Rojas',
      specialtyId: 'odontologia',
    })
    render(<App />)

    await userEvent.click(screen.getByRole('tab', { name: 'Vista previa' }))

    // Aparece en el encabezado y en el bloque de firma del médico.
    expect(screen.getAllByText('Od. Ana Rojas').length).toBeGreaterThan(0)
    expect(screen.getByText('Odontología')).toBeTruthy()
  })

  it('filtra el catálogo por área al agregar servicios', async () => {
    render(<App />)

    await userEvent.click(screen.getAllByRole('button', { name: 'Agregar servicio' })[0])
    // Al abrir se ve todo el catálogo.
    expect(screen.getByText('Cirujano Principal')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Odontología' }))

    expect(screen.queryByText('Cirujano Principal')).toBeNull()
    expect(screen.getByText('Endodoncia unirradicular')).toBeTruthy()
    // Los servicios sin área son transversales y siguen disponibles.
    expect(screen.getByText('Aplicación de vacuna')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Todo el catálogo' }))
    expect(screen.getByText('Cirujano Principal')).toBeTruthy()
  })
})
