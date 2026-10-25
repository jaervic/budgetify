// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HeaderMenu } from './HeaderMenu'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
if (typeof Element !== 'undefined') {
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
}

describe('HeaderMenu', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('abre las acciones secundarias y avisa al pulsar una', async () => {
    const onOpenClinic = vi.fn()
    const onOpenHistory = vi.fn()
    const onOpenCatalog = vi.fn()

    render(
      <HeaderMenu
        onOpenClinic={onOpenClinic}
        onOpenHistory={onOpenHistory}
        onOpenCatalog={onOpenCatalog}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Más opciones' }))
    expect(await screen.findByRole('menuitem', { name: 'Empresa' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Historial' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Catálogo y precios' })).toBeTruthy()

    await userEvent.click(screen.getByRole('menuitem', { name: 'Historial' }))
    expect(onOpenHistory).toHaveBeenCalledOnce()
    expect(onOpenClinic).not.toHaveBeenCalled()
    expect(onOpenCatalog).not.toHaveBeenCalled()
  })
})
