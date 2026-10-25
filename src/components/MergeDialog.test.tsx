// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MergeDialog } from './MergeDialog'
import { useSyncStore } from '@/store/useSyncStore'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
if (typeof Element !== 'undefined' && !Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
}
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

function openMerge(remoteCount: number) {
  useSyncStore.setState({
    mergeOpen: true,
    mergeBusy: false,
    mergeLocalCount: 3,
    mergeRemoteCount: remoteCount,
    error: null,
    user: null,
  })
}

describe('MergeDialog', () => {
  afterEach(() => {
    cleanup()
    useSyncStore.setState({
      mergeOpen: false,
      mergeBusy: false,
      mergeLocalCount: 0,
      mergeRemoteCount: 0,
      error: null,
      user: null,
    })
  })

  it('solo ofrece subir los documentos cuando la nube está vacía', () => {
    openMerge(0)
    render(<MergeDialog />)

    expect(
      screen.getByRole('heading', { name: /Tus documentos están en este equipo/ }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Subir mis documentos' }),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Usar solo la nube' })).toBeNull()
    expect(screen.getAllByText(/3 documentos/).length).toBeGreaterThan(0)
  })

  it('permite combinar o usar la nube cuando ya hay datos remotos', () => {
    openMerge(2)
    render(<MergeDialog />)

    expect(screen.getByRole('button', { name: 'Combinar ambos' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Usar solo la nube' })).toBeTruthy()
  })
})
