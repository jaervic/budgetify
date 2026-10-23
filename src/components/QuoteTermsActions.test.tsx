// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { QuoteTermsActions } from '@/components/QuoteTermsActions'
import { DEFAULT_QUOTE_TERMS } from '@/data/defaults'
import { useBudgetStore } from '@/store/useBudgetStore'

describe('QuoteTermsActions', () => {
  beforeEach(() => {
    useBudgetStore.getState().resetQuoteTermsDefault()
    useBudgetStore.getState().restoreQuoteTerms()
  })

  afterEach(() => {
    cleanup()
  })

  it('guarda las condiciones propias y las usa en la siguiente cotización', async () => {
    useBudgetStore.getState().setQuoteMeta({ terms: 'Garantía de 30 días.' })
    render(<QuoteTermsActions />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar como mis predeterminadas' }),
    )
    useBudgetStore.getState().clearQuote()

    expect(useBudgetStore.getState().quote.terms).toBe('Garantía de 30 días.')
  }, 30_000)

  it('vuelve al texto de fábrica con confirmación', async () => {
    useBudgetStore.getState().setQuoteMeta({ terms: 'Texto cambiado' })
    render(<QuoteTermsActions />)

    await userEvent.click(
      screen.getByRole('button', { name: 'Volver a las condiciones de fábrica' }),
    )
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Volver a las condiciones',
      }),
    )

    expect(useBudgetStore.getState().quote.terms).toBe(DEFAULT_QUOTE_TERMS)
  }, 30_000)
})
