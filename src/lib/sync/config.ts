/** Configuración de la sincronización opcional. */

const env = import.meta.env

function clean(value: string | undefined): string {
  return value?.trim() ?? ''
}

export const SUPABASE_URL = clean(env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = clean(env.VITE_SUPABASE_ANON_KEY)

/**
 * `false` permite desplegar la misma app sin cuenta (por ejemplo, la demo
 * pública) aunque el proyecto tenga credenciales de Supabase configuradas.
 */
export const SYNC_DISABLED_BY_FLAG = env.VITE_SYNC_ENABLED === 'false'

/** Hay credenciales suficientes para intentar sincronizar. */
export const SYNC_CONFIGURED =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

/** La interfaz de cuenta solo aparece si está configurada y no se desactivó. */
export const SYNC_ENABLED = SYNC_CONFIGURED && !SYNC_DISABLED_BY_FLAG
