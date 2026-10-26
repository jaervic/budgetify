import { describe, expect, it, vi } from 'vitest'
import { installPreloadRecovery, PRELOAD_RELOAD_KEY } from './preloadRecovery'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

function fire(target: EventTarget, payload?: unknown): Event {
  const event = new Event('vite:preloadError', { cancelable: true })
  if (payload !== undefined) {
    ;(event as Event & { payload?: unknown }).payload = payload
  }
  target.dispatchEvent(event)
  return event
}

describe('recuperación de imports dinámicos', () => {
  it('recarga una vez, evita bucles y deja de escuchar al limpiar', () => {
    const target = new EventTarget()
    const storage = memoryStorage()
    let now = 1_000_000
    const reload = vi.fn()
    const remove = installPreloadRecovery({
      target,
      storage,
      reload,
      now: () => now,
      online: () => true,
    })

    const first = fire(target)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(first.defaultPrevented).toBe(true)
    expect(storage.getItem(PRELOAD_RELOAD_KEY)).toBe(String(now))

    now += 1_000
    const second = fire(target)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(second.defaultPrevented).toBe(false)

    now += 60_000
    fire(target)
    expect(reload).toHaveBeenCalledTimes(2)

    remove()
    fire(target)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('deja que Supabase reintente sin recargar ni perder el formulario', () => {
    const target = new EventTarget()
    const reload = vi.fn()
    const remove = installPreloadRecovery({
      target,
      storage: memoryStorage(),
      reload,
      online: () => true,
    })

    const event = fire(
      target,
      new Error(
        'Failed to fetch dynamically imported module: https://budgetify-silk.vercel.app/assets/supabase-CVwsoVID.js',
      ),
    )
    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    remove()
  })

  it('no recarga si el navegador está sin conexión', () => {
    const target = new EventTarget()
    const reload = vi.fn()
    const remove = installPreloadRecovery({
      target,
      storage: memoryStorage(),
      reload,
      online: () => false,
    })

    const event = fire(target)
    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    remove()
  })

  it('no arriesga un bucle si el navegador no permite almacenar la marca', () => {
    const target = new EventTarget()
    const reload = vi.fn()
    const remove = installPreloadRecovery({
      target,
      storage: undefined,
      reload,
      online: () => true,
    })

    const event = fire(target)
    expect(reload).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
    remove()
  })
})
