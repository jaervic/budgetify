// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { cloneDefaultClinic, createEmptyQuote } from '@/data/defaults'
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
// Ni el desplazamiento a la opción seleccionada que hace Radix al abrir un Select.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

/** Elige una opción en un Select de Radix (abre y pulsa la opción). */
async function chooseOption(trigger: HTMLElement, name: string | RegExp) {
  await userEvent.click(trigger)
  await userEvent.click(await screen.findByRole('option', { name }))
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
  useBudgetStore.setState({
    clinic: cloneDefaultClinic(),
    rateMode: 'manual',
    history: [],
    docMode: 'budget',
    quote: createEmptyQuote('000000001'),
    quoteCounter: 1,
    quotePageSize: 'Letter',
  })
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

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Nuevo servicio' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(1)
    expect(useBudgetStore.getState().budget.items[0].concept).toBe('Nuevo servicio')
  })

  it('reagrupa la línea al cambiar su categoría', async () => {
    render(<App />)
    await addManualLine()

    await chooseOption(screen.getByLabelText('Categoría'), 'Gastos de Clínica')

    expect(screen.getAllByText('Gastos de Clínica').length).toBeGreaterThan(0)
    expect(screen.queryByText('Honorarios Médicos')).toBeNull()
  })

  it('permite crear una categoría nueva desde el selector', async () => {
    render(<App />)
    await addManualLine()

    await chooseOption(screen.getByLabelText('Categoría'), /Nueva categoría/)
    const draft = screen.getByLabelText('Categoría')
    expect(draft.tagName).toBe('INPUT')

    await userEvent.type(draft, 'Ortodoncia')
    await userEvent.tab()

    expect(useBudgetStore.getState().budget.items[0].category).toBe('Ortodoncia')
    expect(screen.getAllByText('Ortodoncia').length).toBeGreaterThan(0)
  })

  it('conserva el importe al cambiar el tipo de fórmula', async () => {
    render(<App />)
    await addManualLine()

    const amount = screen.getByLabelText('Monto en USD')
    await userEvent.clear(amount)
    await userEvent.type(amount, '250')
    expect(screen.getByTestId('total-usd').textContent).toBe('$250.00')

    await chooseOption(screen.getByLabelText('Tipo de precio'), 'Cantidad × unitario')

    // Antes esto ponía el importe a cero y el servicio desaparecía del total.
    expect(screen.getByTestId('total-usd').textContent).toBe('$250.00')
    expect(
      (screen.getByLabelText('Precio unitario en USD') as HTMLInputElement).value,
    ).toBe('250,00')
  })

  // Recorre tres diálogos y escribe en varios campos: con la suite entera en
  // paralelo pasa de los 5 s por defecto, así que se le da más aire.
  it('guarda una copia y la recupera desde el historial', async () => {
    render(<App />)
    await addManualLine()

    await userEvent.clear(screen.getByLabelText('Paciente'))
    await userEvent.type(screen.getByLabelText('Paciente'), 'Ana Pérez')
    const concept = screen.getByLabelText('Concepto')
    await userEvent.clear(concept)
    await userEvent.type(concept, 'Limpieza dental')
    const amount = screen.getByLabelText('Monto en USD')
    await userEvent.clear(amount)
    await userEvent.type(amount, '250')

    await userEvent.click(screen.getByRole('button', { name: 'Guardar copia en el historial' }))
    expect(useBudgetStore.getState().history).toHaveLength(1)

    // Se tira el presupuesto y se recupera la copia desde el historial.
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar presupuesto' }))
    expect(useBudgetStore.getState().budget.items).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Historial' }))
    expect(await screen.findByText(/Ana Pérez/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /^Abrir la copia/ }))

    const items = useBudgetStore.getState().budget.items
    expect(items).toHaveLength(1)
    expect(items[0].concept).toBe('Limpieza dental')
    expect(screen.getByTestId('total-usd').textContent).toBe('$250.00')
  }, 30_000)

  it('expone los servicios como tabla y da contexto a cada fila', async () => {
    render(<App />)
    await addManualLine()

    expect(screen.getByRole('table', { name: 'Servicios del presupuesto' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Concepto / servicio' })).toBeTruthy()

    // Cada importe describe a qué servicio pertenece.
    const amount = screen.getByLabelText('Monto en USD')
    const describedBy = amount.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(document.getElementById(describedBy as string)?.textContent).toBe('Nuevo servicio')

    // Y los botones de fila se distinguen entre sí.
    expect(screen.getByRole('button', { name: 'Eliminar Nuevo servicio' })).toBeTruthy()
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
    // Este caso renderiza los ~130 servicios del catálogo: en jsdom tarda
    // bastante más que el resto y el límite por defecto (5 s) se queda corto.
  }, 30_000)

  it('cambia a cotización, escoge productos y calcula IVA', async () => {
    render(<App />)

    expect(screen.getByRole('group', { name: 'Tipo de documento' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Cotización' }))
    expect(
      screen.getByRole('button', { name: 'Cotización' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.getByText('Datos de la cotización')).toBeTruthy()
    expect(screen.getByText('Productos')).toBeTruthy()

    // Los datos opcionales se anuncian como un grupo plegable y no se muestran
    // hasta que el usuario los abre.
    const optional = screen.getByRole('button', { name: /Datos opcionales/ })
    expect(optional.getAttribute('aria-expanded')).toBe('false')
    expect(document.getElementById('quote-extra')?.hasAttribute('hidden')).toBe(true)
    await userEvent.click(optional)
    expect(optional.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById('quote-extra')?.hasAttribute('hidden')).toBe(false)

    await userEvent.click(screen.getAllByRole('button', { name: 'Agregar productos' })[0])
    expect(screen.getByRole('checkbox', { name: /Bata de pacientes/ })).toBeTruthy()
    await userEvent.click(
      screen.getByRole('checkbox', { name: /Bata de pacientes/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Agregar (1)' }))

    const items = useBudgetStore.getState().quote.items
    expect(items).toHaveLength(1)
    expect(items[0].code).toBe('BAYP')
    expect(screen.getByRole('table', { name: 'Productos de la cotización' })).toBeTruthy()
    // $6.80 + 16 % IVA = $7.89
    expect(screen.getByTestId('quote-total').textContent).toBe('$7.89')

    await userEvent.click(screen.getByRole('tab', { name: 'Vista previa' }))
    const preview = screen.getByTestId('quote-preview')
    expect(preview.getAttribute('aria-label')).toBe('Vista previa de la cotización')
    expect(preview.textContent).toContain('BAYP')
    expect(preview.textContent).toContain('$7.89')
  }, 30_000)

  it('cotiza en bolívares y convierte los importes con la tasa', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Cotización' }))
    await chooseOption(screen.getByLabelText('Moneda'), 'VES · bolívares')

    await userEvent.click(screen.getAllByRole('button', { name: 'Agregar productos' })[0])
    await userEvent.click(screen.getByRole('checkbox', { name: /Bata de pacientes/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Agregar (1)' }))

    // $7.89 × 876,8 = Bs. 6.917,95
    expect(screen.getByTestId('quote-total').textContent).toBe('Bs. 6.917,95')

    // La opción de ambas monedas añade el equivalente en dólares en la tabla y
    // en los totales, sin cambiar la moneda principal.
    await userEvent.click(
      screen.getByRole('checkbox', {
        name: /Mostrar también los importes en dólares/,
      }),
    )
    expect(screen.getByTestId('quote-total').textContent).toBe('Bs. 6.917,95')
    expect(screen.getAllByText('$7.89').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$6.80').length).toBeGreaterThan(0)
  }, 30_000)
})
