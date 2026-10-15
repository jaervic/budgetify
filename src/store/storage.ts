import type { StateStorage } from 'zustand/middleware'

/** Evento que se dispara cuando el navegador rechaza guardar los cambios. */
export const STORAGE_ERROR_EVENT = 'budgetify:storage-error'

export interface StorageErrorDetail {
  /** Clave que no se pudo guardar. */
  name: string
  /** Tamaño (caracteres) del valor que se intentó escribir. */
  size: number
}

/**
 * Almacenamiento para Zustand `persist` que escribe en localStorage con debounce.
 * Evita golpear el disco en cada tecla mientras se edita el presupuesto.
 *
 * Si el navegador rechaza la escritura (cuota llena o modo privado) se emite un
 * evento para que la app avise al usuario. Antes el error se descartaba en
 * silencio: se seguía trabajando sobre datos que se perdían al cerrar la
 * pestaña, sin ninguna señal.
 */
export function createDebouncedStorage(delay = 500): StateStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const pending = new Map<string, string>()

  const notifyError = (name: string, size: number): void => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent<StorageErrorDetail>(STORAGE_ERROR_EVENT, {
        detail: { name, size },
      }),
    )
  }

  const write = (name: string): void => {
    const value = pending.get(name)
    timers.delete(name)
    if (value === undefined) return
    pending.delete(name)
    try {
      localStorage.setItem(name, value)
    } catch {
      // Cuota llena o modo privado: avisamos en lugar de perderlo en silencio.
      notifyError(name, value.length)
    }
  }

  /** Fuerza la escritura inmediata de todo lo pendiente (al salir de la página). */
  const flush = (): void => {
    for (const timer of timers.values()) clearTimeout(timer)
    for (const name of [...pending.keys()]) write(name)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
  }

  return {
    getItem: (name) => {
      if (typeof localStorage === 'undefined') return null
      // Prioriza lo pendiente de escribir para no leer datos obsoletos.
      return pending.get(name) ?? localStorage.getItem(name)
    },
    setItem: (name, value) => {
      pending.set(name, value)
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)
      timers.set(
        name,
        setTimeout(() => write(name), delay),
      )
    },
    removeItem: (name) => {
      pending.delete(name)
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)
      timers.delete(name)
      if (typeof localStorage !== 'undefined') localStorage.removeItem(name)
    },
  }
}
