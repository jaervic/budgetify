import { newId } from '@/lib/ids'

/** Marca de quién es el `localStorage` actual y qué dispositivo es. */
export interface LocalOwner {
  /** `null` = datos locales sin cuenta (invitado). */
  userId: string | null
  deviceId: string
  deviceName: string
}

export const LOCAL_OWNER_KEY = 'budgetify:owner:v1'

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function defaultDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Este equipo'
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? 'Teléfono'
    : 'Computadora'
}

function createOwner(): LocalOwner {
  return {
    userId: null,
    deviceId: newId('device'),
    deviceName: defaultDeviceName(),
  }
}

function persistOwner(owner: LocalOwner): void {
  try {
    storage()?.setItem(LOCAL_OWNER_KEY, JSON.stringify(owner))
  } catch {
    // Sin almacenamiento la app sigue funcionando, solo que sin recordar el dueño.
  }
}

/** Lee (o crea) la marca local. Nunca lanza si el JSON está corrupto. */
export function readOwner(): LocalOwner {
  const store = storage()
  if (!store) return createOwner()
  try {
    const raw = store.getItem(LOCAL_OWNER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalOwner>
      if (typeof parsed.deviceId === 'string' && parsed.deviceId.length > 0) {
        return {
          userId: typeof parsed.userId === 'string' ? parsed.userId : null,
          deviceId: parsed.deviceId,
          deviceName:
            typeof parsed.deviceName === 'string' && parsed.deviceName.trim()
              ? parsed.deviceName.trim()
              : defaultDeviceName(),
        }
      }
    }
  } catch {
    // JSON corrupto o `localStorage` bloqueado: se regenera abajo.
  }
  const owner = createOwner()
  persistOwner(owner)
  return owner
}

export function writeOwner(patch: Partial<LocalOwner>): LocalOwner {
  const next = { ...readOwner(), ...patch }
  persistOwner(next)
  return next
}

/** Desvincula la cuenta sin perder el id del dispositivo. */
export function clearOwnerUser(): LocalOwner {
  return writeOwner({ userId: null })
}
