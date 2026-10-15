// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedStorage, STORAGE_ERROR_EVENT, type StorageErrorDetail } from './storage'

function listen() {
  const listener = vi.fn()
  window.addEventListener(STORAGE_ERROR_EVENT, listener)
  return {
    listener,
    stop: () => window.removeEventListener(STORAGE_ERROR_EVENT, listener),
  }
}

describe('createDebouncedStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('escribe tras el retardo y no avisa si hay espacio', () => {
    vi.useFakeTimers()
    const storage = createDebouncedStorage(10)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { listener, stop } = listen()

    storage.setItem('budgetify:test', 'ok')
    expect(setItem).not.toHaveBeenCalled()

    vi.advanceTimersByTime(20)

    expect(setItem).toHaveBeenCalledWith('budgetify:test', 'ok')
    expect(listener).not.toHaveBeenCalled()
    stop()
  })

  it('avisa cuando el navegador rechaza guardar (cuota llena)', () => {
    vi.useFakeTimers()
    const storage = createDebouncedStorage(10)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    const { listener, stop } = listen()

    storage.setItem('budgetify:v1', 'x'.repeat(42))
    vi.advanceTimersByTime(20)

    expect(listener).toHaveBeenCalledTimes(1)
    const event = listener.mock.calls[0][0] as CustomEvent<StorageErrorDetail>
    expect(event.detail).toEqual({ name: 'budgetify:v1', size: 42 })
    stop()
  })

  it('lee lo pendiente de escribir antes que el disco', () => {
    vi.useFakeTimers()
    const storage = createDebouncedStorage(1000)

    storage.setItem('budgetify:test', 'nuevo')
    expect(storage.getItem('budgetify:test')).toBe('nuevo')
  })
})
