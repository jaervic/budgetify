// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { keepOpenForToast } from './undo'

interface FakeEvent {
  target: EventTarget
  defaultPrevented: boolean
  preventDefault: () => void
}

/** Evento mínimo: solo se usan el objetivo y `preventDefault`. */
function fakeEvent(target: EventTarget): FakeEvent {
  const event: FakeEvent = {
    target,
    defaultPrevented: false,
    preventDefault: () => {
      event.defaultPrevented = true
    },
  }
  return event
}

describe('keepOpenForToast', () => {
  it('deja cerrar el diálogo cuando el clic no cae en un aviso', () => {
    const fuera = document.createElement('button')
    document.body.append(fuera)

    const event = fakeEvent(fuera)
    keepOpenForToast(event)

    expect(event.defaultPrevented).toBe(false)
  })

  it('anula el cierre cuando el clic cae en un aviso', () => {
    const toaster = document.createElement('ol')
    toaster.dataset.sonnerToaster = ''
    const boton = document.createElement('button')
    toaster.append(boton)
    document.body.append(toaster)

    const event = fakeEvent(boton)
    keepOpenForToast(event)

    expect(event.defaultPrevented).toBe(true)
  })
})
