/**
 * Recuperación de imports dinámicos después de un despliegue.
 *
 * Los chunks llevan hash y Vercel no conserva para siempre los de versiones
 * anteriores. Si una pestaña vieja intenta cargar uno que ya no existe (por
 * ejemplo, el cliente de Supabase), Vite emite `vite:preloadError`. En vez de
 * enseñar el error técnico, se recarga una vez para tomar la versión nueva.
 */

export const PRELOAD_RELOAD_KEY = 'budgetify:preload-reload-at'
const RELOAD_COOLDOWN_MS = 60_000
/** El cliente de Supabase se reintenta sin recargar para no perder el formulario. */
const SUPABASE_CHUNK = /supabase-[^/]+\.js/i

interface PreloadRecoveryOptions {
  target?: EventTarget
  storage?: Pick<Storage, 'getItem' | 'setItem'>
  reload?: () => void
  now?: () => number
  online?: () => boolean
}

function getSessionStorage(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.sessionStorage
  } catch {
    // Navegadores con almacenamiento restringido: no se arriesga un bucle.
    return undefined
  }
}

function payloadMessage(event: Event): string {
  const payload = (event as Event & { payload?: unknown }).payload
  if (payload instanceof Error) return payload.message
  if (typeof payload === 'string') return payload
  return ''
}

export function installPreloadRecovery({
  target = typeof window === 'undefined' ? undefined : window,
  storage = getSessionStorage(),
  reload = () => window.location.reload(),
  now = Date.now,
  online = () => typeof navigator === 'undefined' || navigator.onLine,
}: PreloadRecoveryOptions = {}): () => void {
  if (!target) return () => {}

  const onPreloadError = (event: Event) => {
    // Sin red, recargar no arregla nada: se deja que la app muestre su aviso.
    if (!online()) return

    // Supabase ya sabe reintentar sin recargar y no queremos borrar el correo
    // ni la contraseña que la persona acaba de escribir.
    if (SUPABASE_CHUNK.test(payloadMessage(event))) return

    // Sin almacenamiento no se puede recordar la recarga y se podría crear un
    // bucle. Mejor mostrar el error amable que la app ya prepara.
    if (!storage) return

    const timestamp = now()
    let lastReloadAt = 0
    try {
      lastReloadAt = Number(storage.getItem(PRELOAD_RELOAD_KEY)) || 0
    } catch {
      return
    }

    if (timestamp - lastReloadAt < RELOAD_COOLDOWN_MS) return

    try {
      storage.setItem(PRELOAD_RELOAD_KEY, String(timestamp))
    } catch {
      return
    }

    event.preventDefault()
    reload()
  }

  target.addEventListener('vite:preloadError', onPreloadError)
  return () => target.removeEventListener('vite:preloadError', onPreloadError)
}
