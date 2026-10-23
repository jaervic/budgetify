import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_NOTES, DEFAULT_QUOTE_TERMS } from '@/data/defaults'
import { useBudgetStore } from './useBudgetStore'

describe('notas y condiciones predeterminadas', () => {
  beforeEach(() => {
    useBudgetStore.getState().resetBudgetNotesDefault()
    useBudgetStore.getState().resetQuoteTermsDefault()
    useBudgetStore.getState().clearBudget()
    useBudgetStore.getState().restoreBudgetNotes('all')
    useBudgetStore.getState().restoreQuoteTerms()
  })

  it('un presupuesto nuevo usa las notas propias guardadas', () => {
    useBudgetStore.getState().setNotes(['Pago en efectivo en consultorio.'])
    useBudgetStore.getState().saveBudgetNotesDefault()
    useBudgetStore.getState().clearBudget()

    expect(useBudgetStore.getState().budget.notes).toEqual(['Pago en efectivo en consultorio.'])
  })

  it('restaurar todas vuelve a las predeterminadas guardadas', () => {
    useBudgetStore.getState().setNotes(['otra cosa'])
    useBudgetStore.getState().restoreBudgetNotes('all')
    expect(useBudgetStore.getState().budget.notes).toEqual(DEFAULT_NOTES)
  })

  it('restaurar una sola nota no cambia las demás', () => {
    useBudgetStore.getState().setNotes([DEFAULT_NOTES[0], 'editada', DEFAULT_NOTES[2]])
    useBudgetStore.getState().restoreBudgetNotes({ index: 1 })
    // La nota 1 no tiene predeterminada con el mismo título, así que no cambia.
    expect(useBudgetStore.getState().budget.notes[1]).toBe('editada')

    useBudgetStore.getState().setNotes([DEFAULT_NOTES[0], 'Fluctuación Cambiaria: mal', DEFAULT_NOTES[2]])
    useBudgetStore.getState().restoreBudgetNotes({ index: 1 })
    expect(useBudgetStore.getState().budget.notes[1]).toBe(DEFAULT_NOTES[1])
    expect(useBudgetStore.getState().budget.notes[2]).toBe(DEFAULT_NOTES[2])
  })

  it('volver a poner las que faltan no duplica las que siguen', () => {
    useBudgetStore.getState().setNotes([DEFAULT_NOTES[0]])
    useBudgetStore.getState().restoreBudgetNotes('missing')
    expect(useBudgetStore.getState().budget.notes).toEqual(DEFAULT_NOTES)
  })

  it('las condiciones propias se usan en una cotización nueva', () => {
    useBudgetStore.getState().setQuoteMeta({ terms: 'Garantía de 30 días.' })
    useBudgetStore.getState().saveQuoteTermsDefault()
    useBudgetStore.getState().clearQuote()

    expect(useBudgetStore.getState().quote.terms).toBe('Garantía de 30 días.')
  })

  it('restaurar las condiciones vuelve al texto predeterminado', () => {
    useBudgetStore.getState().setQuoteMeta({ terms: 'otro texto' })
    useBudgetStore.getState().restoreQuoteTerms()
    expect(useBudgetStore.getState().quote.terms).toBe(DEFAULT_QUOTE_TERMS)
  })

  it('guardar condiciones vacías las deja sin texto', () => {
    useBudgetStore.getState().setQuoteMeta({ terms: undefined })
    useBudgetStore.getState().saveQuoteTermsDefault()
    useBudgetStore.getState().restoreQuoteTerms()
    expect(useBudgetStore.getState().quote.terms).toBeUndefined()
  })
})
