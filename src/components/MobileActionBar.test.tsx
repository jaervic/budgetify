// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MobileActionBar } from '@/components/MobileActionBar'

describe('MobileActionBar', () => {
  afterEach(() => {
    cleanup()
  })

  it('se oculta mientras el usuario escribe, para no tapar el campo', () => {
    render(
      <>
        <input aria-label="Monto en USD" />
        <MobileActionBar onViewPdf={() => {}} />
      </>,
    )
    const bar = screen.getByRole('button', { name: 'Descargar PDF' }).closest('.fixed')!

    expect(bar.className).not.toContain('translate-y-full')

    act(() => screen.getByLabelText('Monto en USD').focus())
    expect(bar.className).toContain('translate-y-full')

    act(() => (document.activeElement as HTMLElement).blur())
    expect(bar.className).not.toContain('translate-y-full')
  })

  it('se oculta al bajar por la página y vuelve al subir', () => {
    render(<MobileActionBar onViewPdf={() => {}} />)
    const bar = screen.getByRole('button', { name: 'Descargar PDF' }).closest('.fixed')!

    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 400 })
    act(() => window.dispatchEvent(new Event('scroll')))
    expect(bar.className).toContain('translate-y-full')

    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 200 })
    act(() => window.dispatchEvent(new Event('scroll')))
    expect(bar.className).not.toContain('translate-y-full')
  })
})
