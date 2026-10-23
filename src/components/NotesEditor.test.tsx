// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NotesEditor } from '@/components/NotesEditor'
import { DEFAULT_NOTES } from '@/data/defaults'
import { useBudgetStore } from '@/store/useBudgetStore'

describe('NotesEditor', () => {
  beforeEach(() => {
    useBudgetStore.getState().clearBudget()
    useBudgetStore.getState().resetBudgetNotesDefault()
    useBudgetStore.getState().restoreBudgetNotes('all')
  })

  afterEach(() => {
    cleanup()
  })

  it('avisa de la nota de fábrica que falta y la vuelve a poner', async () => {
    render(<NotesEditor />)

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar nota 2' }))
    expect(screen.getByText(/Faltan una nota/)).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Volver a ponerlas' }))
    expect(useBudgetStore.getState().budget.notes).toEqual(DEFAULT_NOTES)
  }, 30_000)

  it('restaura el texto original de una nota editada', async () => {
    render(<NotesEditor />)

    const first = screen.getByLabelText('Nota 1')
    await userEvent.clear(first)
    await userEvent.type(first, 'Formas de Pago: efectivo en consultorio')
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar texto original' }))

    expect(useBudgetStore.getState().budget.notes[0]).toBe(DEFAULT_NOTES[0])
  }, 30_000)

  it('guarda las notas actuales como predeterminadas para los presupuestos nuevos', async () => {
    render(<NotesEditor />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar como mis predeterminadas' }),
    )
    useBudgetStore.getState().clearBudget()

    expect(useBudgetStore.getState().budget.notes).toEqual(DEFAULT_NOTES)
    expect(useBudgetStore.getState().savedBudgetNotes).toEqual(DEFAULT_NOTES)
  }, 30_000)
})
