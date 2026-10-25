/**
 * Cambios hechos **sin sesión** después de haber usado una cuenta en este
 * equipo. Se guardan aparte de los metadatos de la cuenta para poder subirlos
 * cuando la persona vuelva a iniciar sesión, sin tener que reenviar todo.
 */
export interface GuestDirty {
  profile: boolean
  draftBudget: boolean
  draftQuote: boolean
}

const GUEST_DIRTY_KEY = 'budgetify:guest-dirty:v1'

const EMPTY: GuestDirty = {
  profile: false,
  draftBudget: false,
  draftQuote: false,
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readGuestDirty(): GuestDirty {
  const store = storage()
  if (!store) return { ...EMPTY }
  try {
    const raw = store.getItem(GUEST_DIRTY_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<GuestDirty>
    return {
      profile: parsed.profile === true,
      draftBudget: parsed.draftBudget === true,
      draftQuote: parsed.draftQuote === true,
    }
  } catch {
    return { ...EMPTY }
  }
}

export function hasGuestDirty(flags: GuestDirty): boolean {
  return flags.profile || flags.draftBudget || flags.draftQuote
}

export function markGuestDirty(slice: keyof GuestDirty): void {
  const flags = readGuestDirty()
  if (flags[slice]) return
  flags[slice] = true
  try {
    storage()?.setItem(GUEST_DIRTY_KEY, JSON.stringify(flags))
  } catch {
    // Sin almacenamiento no se puede recordar; el próximo inicio de sesión
    // volverá a marcar lo que sea relevante.
  }
}

export function clearGuestDirty(): void {
  try {
    storage()?.removeItem(GUEST_DIRTY_KEY)
  } catch {
    // Nada que limpiar.
  }
}
