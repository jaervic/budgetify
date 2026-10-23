// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProductsPanel } from '@/components/catalog/ProductsPanel'
import { useBudgetStore } from '@/store/useBudgetStore'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

describe('ProductsPanel', () => {
  beforeEach(() => {
    useBudgetStore.getState().resetCatalog()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('filtra por categoría sin perder el catálogo completo', async () => {
    render(<ProductsPanel />)

    expect(screen.getByDisplayValue('Bata de pacientes 30 grs. Talla M')).toBeTruthy()

    await userEvent.click(screen.getByRole('button', { name: 'Medicamentos' }))

    expect(
      screen.getByDisplayValue('Solución fisiológica 0.9 % 500 ml'),
    ).toBeTruthy()
    expect(
      screen.queryByDisplayValue('Bata de pacientes 30 grs. Talla M'),
    ).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(screen.getByDisplayValue('Bata de pacientes 30 grs. Talla M')).toBeTruthy()
  }, 30_000)

  it('crea un producto manual con la categoría activa y permite editar su precio', async () => {
    render(<ProductsPanel />)

    await userEvent.click(screen.getByRole('button', { name: 'Medicamentos' }))
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))

    const products = useBudgetStore.getState().catalog.products
    const created = products.find((product) => product.description === 'Nuevo producto')
    expect(created).toBeTruthy()
    expect(created?.category).toBe('Medicamentos')

    const description = screen.getByDisplayValue('Nuevo producto')
    await waitFor(() => {
      expect(document.activeElement).toBe(description)
    })

    const price = screen.getByLabelText('Precio en USD de Nuevo producto')
    await userEvent.clear(price)
    await userEvent.type(price, '12,5')

    expect(
      useBudgetStore.getState().catalog.products.find((p) => p.id === created?.id)
        ?.priceUsd,
    ).toBe(12.5)
  }, 30_000)

  it('muestra y enfoca el producto nuevo aunque haya una búsqueda activa', async () => {
    render(<ProductsPanel />)

    const search = screen.getByLabelText('Buscar productos') as HTMLInputElement
    await userEvent.type(search, 'gasa')
    await userEvent.click(screen.getByRole('button', { name: 'Nuevo producto' }))

    const description = screen.getByDisplayValue('Nuevo producto') as HTMLInputElement
    expect(description).toBeTruthy()
    expect(search.value).toBe('')

    await waitFor(() => {
      expect(document.activeElement).toBe(description)
    })
  }, 30_000)
})
