import { toast } from 'sonner'
import { quoteNumberValue } from '@/data/defaults'
import type { PersistedState } from '@/store/migrate'
import { useBudgetStore } from '@/store/useBudgetStore'
import { useSyncStore } from '@/store/useSyncStore'
import type { Budget, Quote, SavedDocument } from '@/types'
import { authErrorMessage } from './authErrors'
import * as api from './client'
import { SYNC_ENABLED } from './config'
import { historyDiff, pendingCount } from './diff'
import {
  clearGuestDirty,
  hasGuestDirty,
  markGuestDirty,
  readGuestDirty,
} from './guestDirty'
import {
  hasMeaningfulBudget,
  hasMeaningfulLocalData,
  hasMeaningfulProfile,
  hasMeaningfulQuote,
} from './localData'
import { clearMeta, readMeta, writeMeta } from './meta'
import {
  budgetDraftPayload,
  conflictDocument,
  duplicateQuoteNumbers,
  maxQuoteCounter,
  mergeHistory,
  mergeProfiles,
  parseDraftPayload,
  parseProfilePayload,
  parseRemoteDocument,
  profileFromState,
  profileToStatePatch,
  quoteDraftPayload,
  syncProfileSchema,
} from './merge'
import { clearOwnerUser, readOwner, writeOwner } from './owner'
import type {
  MergeStrategy,
  RemoteSnapshot,
  SyncLocalSnapshot,
  SyncMeta,
  SyncUser,
} from './types'
import { HISTORY_LIMIT } from '@/lib/limits'

interface AuthUser {
  id: string
  email?: string | null
}

let started = false
let applyingRemote = false
let syncPromise: Promise<void> | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let authUnsubscribe: (() => void) | null = null
let authSetupPromise: Promise<void> | null = null
/** Hay que decidir qué hacer con los datos locales antes de sincronizar. */
let accountDecisionPending = false
/** Se está cerrando sesión o borrando la cuenta: no iniciar otra subida. */
let accountClosing = false
/** Cambios que llegaron mientras una subida ya estaba en marcha. */
const dirtyDuringSync = new Set<DirtySlice>()

function syncSnapshot(): SyncLocalSnapshot {
  const state = useBudgetStore.getState()
  return {
    clinic: state.clinic,
    catalog: state.catalog,
    savedBudgetNotes: state.savedBudgetNotes,
    savedQuoteTerms: state.savedQuoteTerms,
    pageSize: state.pageSize,
    quotePageSize: state.quotePageSize,
    rateMode: state.rateMode,
    quoteCounter: state.quoteCounter,
    budget: state.budget,
    quote: state.quote,
    history: state.history,
  }
}

function updatePending(): void {
  const user = useSyncStore.getState().user
  const meta = user ? readMeta(user.id) : null
  useSyncStore
    .getState()
    .setPending(meta ? pendingCount(useBudgetStore.getState().history, meta) : 0)
}

/**
 * Convierte las altas y bajas del historial en lápidas/restauraciones
 * explícitas. Se hace al vuelo, no al sincronizar, para no confundir un
 * borrado deliberado con una pérdida de `localStorage`.
 */
function reconcileHistoryMeta(
  userId: string,
  current: SavedDocument[],
  previous: SavedDocument[],
): void {
  const meta = readMeta(userId)
  const previousIds = new Set(previous.map((document) => document.id))
  const currentIds = new Set(current.map((document) => document.id))
  let changed = false

  for (const id of previousIds) {
    if (
      !currentIds.has(id) &&
      meta.knownHistoryIds.includes(id) &&
      !(id in meta.deletedHistory)
    ) {
      meta.deletedHistory[id] = new Date().toISOString()
      delete meta.resurrectedHistory[id]
      meta.knownHistoryIds = meta.knownHistoryIds.filter((known) => known !== id)
      meta.syncedDeletions = meta.syncedDeletions.filter((synced) => synced !== id)
      changed = true
    }
  }

  for (const document of current) {
    if (meta.deletedHistory[document.id]) {
      // Deshacer un borrado: se quita la lápida y se vuelve a subir. La marca
      // de restauración permite ignorar una lápida remota anterior.
      delete meta.deletedHistory[document.id]
      meta.syncedDeletions = meta.syncedDeletions.filter(
        (synced) => synced !== document.id,
      )
      meta.knownHistoryIds = meta.knownHistoryIds.filter(
        (known) => known !== document.id,
      )
      meta.resurrectedHistory[document.id] = new Date().toISOString()
      changed = true
    }
  }

  if (changed) writeMeta(meta)
}

function scheduleSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void syncNow('change')
  }, 2_000)
}

type DirtySlice = keyof SyncMeta['dirty']

function markDirty(slice: DirtySlice): void {
  if (applyingRemote) return
  const user = useSyncStore.getState().user
  if (!user) return
  const meta = readMeta(user.id)
  if (!meta.dirty[slice]) {
    meta.dirty[slice] = true
    writeMeta(meta)
  }
  // `markDirty` puede ejecutarse mientras `pushLocal` está esperando la red.
  // Esa subida termina escribiendo metadatos: hay que recordar el cambio para
  // volver a marcarlo al final y no perderlo.
  if (syncPromise) dirtyDuringSync.add(slice)
  updatePending()
  scheduleSync()
}

function mergeStoredMeta(userId: string, meta: SyncMeta): SyncMeta {
  const stored = readMeta(userId)
  const localIds = new Set(useBudgetStore.getState().history.map((document) => document.id))
  const deletedHistory = { ...meta.deletedHistory, ...stored.deletedHistory }
  const syncedDeletions = new Set([
    ...meta.syncedDeletions,
    ...stored.syncedDeletions,
  ])
  const resurrectedHistory = {
    ...meta.resurrectedHistory,
    ...stored.resurrectedHistory,
  }
  const restored = new Set<string>()

  // Un documento presente en el historial no puede tener lápida: si aparece,
  // es que la persona deshizo el borrado. Se quita la lápida y se vuelve a
  // subir (con `deleted_at: null`) en el siguiente ciclo.
  for (const id of Object.keys(deletedHistory)) {
    if (localIds.has(id)) {
      delete deletedHistory[id]
      syncedDeletions.delete(id)
      restored.add(id)
    }
  }

  const known = new Set([
    ...meta.knownHistoryIds,
    ...stored.knownHistoryIds,
  ])
  for (const id of restored) known.delete(id)

  for (const id of Object.keys(deletedHistory)) {
    delete resurrectedHistory[id]
  }
  for (const id of Object.keys(resurrectedHistory)) {
    // Ya se subió activo o ya no está en el historial local.
    if (known.has(id) || !localIds.has(id)) delete resurrectedHistory[id]
  }

  return {
    ...meta,
    dirty: {
      profile: meta.dirty.profile || stored.dirty.profile,
      draftBudget: meta.dirty.draftBudget || stored.dirty.draftBudget,
      draftQuote: meta.dirty.draftQuote || stored.dirty.draftQuote,
    },
    profileMergePending: meta.profileMergePending || stored.profileMergePending,
    deletedHistory,
    syncedDeletions: [...syncedDeletions].filter((id) => id in deletedHistory),
    // Se conservan los ids conocidos aunque no estén ahora en el historial:
    // `doSync` los interpreta como una pérdida local y hace un pull completo.
    knownHistoryIds: [...known].filter((id) => !(id in deletedHistory)),
    resurrectedHistory,
  }
}

function maxTimestamp(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  const timeA = Date.parse(a)
  const timeB = Date.parse(b)
  if (!Number.isFinite(timeA)) return b
  if (!Number.isFinite(timeB)) return a
  return timeB > timeA ? b : a
}

function isNewer(updatedAt: string, lastPulledAt: string | null): boolean {
  if (!lastPulledAt) return true
  const updated = Date.parse(updatedAt)
  const cursor = Date.parse(lastPulledAt)
  if (!Number.isFinite(updated) || !Number.isFinite(cursor)) {
    return updatedAt > lastPulledAt
  }
  return updated > cursor
}



function handleOnline(): void {
  const store = useSyncStore.getState()
  if (!store.user) return
  store.setStatus('idle')
  void syncNow('online')
}

function handleOffline(): void {
  const store = useSyncStore.getState()
  if (store.user) store.setStatus('offline')
}

function handleVisibility(): void {
  if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
  const store = useSyncStore.getState()
  if (store.user && !store.mergeOpen) void syncNow('focus')
}

function handleSignedOut(): void {
  const store = useSyncStore.getState()
  store.setUser(null)
  store.setStatus('signed-out')
  store.setPending(0)
  store.setLastSyncedAt(null)
  store.setError(null)
  store.closeMerge()
  store.setRecoveryOpen(false)
}

/**
 * Arranca la sincronización una sola vez. Si no hay credenciales o la bandera
 * está apagada, no carga Supabase ni registra nada.
 */
export function initSync(): void {
  if (started) return
  started = true
  const store = useSyncStore.getState()
  store.setEnabled(SYNC_ENABLED)
  if (!SYNC_ENABLED) {
    store.setStatus('disabled')
    return
  }

  readOwner()

  useBudgetStore.subscribe((state, previous) => {
    if (applyingRemote) return
    const user = useSyncStore.getState().user
    const profileChanged =
      state.clinic !== previous.clinic ||
      state.catalog !== previous.catalog ||
      state.savedBudgetNotes !== previous.savedBudgetNotes ||
      state.savedQuoteTerms !== previous.savedQuoteTerms ||
      state.pageSize !== previous.pageSize ||
      state.quotePageSize !== previous.quotePageSize ||
      state.rateMode !== previous.rateMode ||
      state.quoteCounter !== previous.quoteCounter
    const budgetChanged = state.budget !== previous.budget
    const quoteChanged = state.quote !== previous.quote

    if (user) {
      if (profileChanged) markDirty('profile')
      if (budgetChanged) markDirty('draftBudget')
      if (quoteChanged) markDirty('draftQuote')
    } else {
      // Ediciones hechas sin cuenta: se recordarán para el próximo inicio de
      // sesión, incluso si el dueño anterior era la misma persona.
      if (profileChanged) markGuestDirty('profile')
      if (budgetChanged) markGuestDirty('draftBudget')
      if (quoteChanged) markGuestDirty('draftQuote')
    }
    if (state.history !== previous.history) {
      // Se registra también sin sesión: si el equipo pertenece a una cuenta,
      // las lápidas deben sobrevivir a un cierre de sesión sin borrar datos.
      const owner = readOwner()
      if (owner.userId) {
        reconcileHistoryMeta(owner.userId, state.history, previous.history)
      }
      if (user) scheduleSync()
      updatePending()
    }
  })

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibility)
  }

  // Sin una sesión guardada ni un enlace mágico en la URL no hace falta
  // descargar el cliente de Supabase al arrancar.
  if (shouldBootstrapSync()) void bootstrap()
  else store.setStatus('signed-out')
}

function hasStoredSession(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) return true
    }
  } catch {
    // `localStorage` bloqueado: se tratará como sin sesión.
  }
  return false
}

function authParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  const search = window.location.search.replace(/^\?/, '')
  return new URLSearchParams(hash).get(name) ?? new URLSearchParams(search).get(name)
}

function isAuthCallback(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    authParam('access_token') ||
      authParam('error') ||
      authParam('error_description') ||
      authParam('code') ||
      authParam('type'),
  )
}

/** Quita de la URL los tokens de recuperación una vez usados. */
function clearAuthHash(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    for (const key of [
      'access_token',
      'refresh_token',
      'expires_in',
      'expires_at',
      'token_type',
      'type',
      'code',
      'error',
      'error_description',
      'error_code',
    ]) {
      url.searchParams.delete(key)
    }
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  } catch {
    // Algunos navegadores embebidos no permiten `replaceState`.
  }
}

function shouldBootstrapSync(): boolean {
  return isAuthCallback() || hasStoredSession()
}

async function setupAuthListener(): Promise<void> {
  if (authUnsubscribe) return
  if (authSetupPromise) return authSetupPromise
  authSetupPromise = api
    .onAuthChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        handleSignedOut()
        return
      }
      if (event === 'PASSWORD_RECOVERY') {
        useSyncStore.getState().setRecoveryOpen(true)
        const user = nextSession?.user
        if (user) {
          setTimeout(() => {
            void handleSignedIn(user, event)
          }, 0)
        }
        return
      }
      const user = nextSession?.user
      if (
        user &&
        (event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED')
      ) {
        // No hacer llamadas a Supabase dentro del callback: el cliente espera a
        // que termine y se produce un interbloqueo. Se difiere al siguiente tick.
        setTimeout(() => {
          void handleSignedIn(user, event)
        }, 0)
      }
    })
    .then((unsubscribe) => {
      authUnsubscribe = unsubscribe
    })
    .finally(() => {
      authSetupPromise = null
    })
  await authSetupPromise
}

function readAuthError(): string | null {
  const description = authParam('error_description') ?? authParam('error')
  return description && description.trim() ? description : null
}

async function bootstrap(): Promise<void> {
  const store = useSyncStore.getState()
  try {
    if (authParam('type') === 'recovery') {
      store.setRecoveryOpen(true)
    }

    const authError = readAuthError()
    if (authError) {
      store.setStatus('error')
      store.setError(authError)
      // Quita los tokens/errores de la barra de direcciones.
      try {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        )
      } catch {
        // Algunos navegadores embebidos no permiten `replaceState`.
      }
    }
    await setupAuthListener()
    const session = await api.getSession()
    if (session?.user) await handleSignedIn(session.user, 'INITIAL_SESSION')
    else {
      store.setUser(null)
      if (!authError) store.setStatus('signed-out')
    }
  } catch (error) {
    store.setStatus(api.isOnline() ? 'error' : 'offline')
    store.setError(api.errorMessage(error))
  }
}

async function handleSignedIn(authUser: AuthUser, event: string): Promise<void> {
  const store = useSyncStore.getState()
  const user: SyncUser = { id: authUser.id, email: authUser.email ?? null }
  const previous = store.user
  store.setUser(user)
  store.setError(null)

  // El callback de Auth puede disparar varias veces para el mismo usuario.
  if (previous?.id === user.id) {
    if (!store.mergeOpen && !accountDecisionPending) await syncNow('auth')
    return
  }

  const owner = readOwner()
  const local = syncSnapshot()
  const localHasData = hasMeaningfulLocalData(local)
  const firstAdoption = owner.userId !== user.id

  // Ya hay datos en este equipo (de una cuenta anterior o de un invitado):
  // nunca se suben solos a la cuenta que se acaba de abrir.
  if (owner.userId !== user.id && localHasData) {
    accountDecisionPending = true
    try {
      let remoteDocuments = -1
      try {
        remoteDocuments = (await api.fetchRemoteCounts(user.id)).documents
      } catch {
        // Sin red se muestra «no se pudo comprobar»; las opciones reintentarán.
      }
      // La sesión pudo cerrarse mientras se consultaba la nube.
      if (
        accountClosing ||
        useSyncStore.getState().user?.id !== user.id
      ) {
        return
      }
      store.openMerge(user.id, local.history.length, remoteDocuments)
      store.setStatus('idle')
    } finally {
      accountDecisionPending = false
    }
    return
  }

  writeOwner({ userId: user.id })
  const meta = readMeta(user.id)
  const guest = readGuestDirty()

  if (firstAdoption) {
    // Un equipo recién adoptado tiene que leer la nube completa para poder
    // unir el historial, no solo los cambios posteriores al cursor.
    meta.lastPulledAt = null
    meta.knownHistoryIds = []
    meta.historyRevs = {}
    if (localHasData) {
      if (hasMeaningfulProfile(local)) {
        meta.dirty.profile = true
        meta.profileMergePending = true
      }
      if (hasMeaningfulBudget(local.budget)) meta.dirty.draftBudget = true
      if (hasMeaningfulQuote(local.quote)) meta.dirty.draftQuote = true
    }
  }

  // Ediciones hechas sin sesión después de usar esta cuenta.
  if (guest.profile) meta.dirty.profile = true
  if (guest.draftBudget) meta.dirty.draftBudget = true
  if (guest.draftQuote) meta.dirty.draftQuote = true
  if (firstAdoption) meta.profileMergePending = meta.dirty.profile
  if (firstAdoption || hasGuestDirty(guest)) writeMeta(meta)
  clearGuestDirty()

  store.setLastSyncedAt(meta.lastSyncedAt)
  store.setPending(pendingCount(local.history, meta))
  await syncNow(event === 'INITIAL_SESSION' ? 'restore' : 'login')
}

/**
 * Resuelve el caso de un equipo que ya tenía datos de otra cuenta.
 *  - `merge`: conserva todo y sube lo local a la cuenta nueva.
 *  - `cloud`: descarta lo local y restaura lo que haya en la nube.
 */
export async function resolveMerge(strategy: MergeStrategy): Promise<void> {
  const store = useSyncStore.getState()
  const userId = store.mergeUserId
  if (!userId) return
  store.setMergeBusy(true)
  try {
    if (strategy === 'cloud') {
      if (!api.isOnline()) {
        throw new Error('Necesitas conexión para restaurar los datos de la nube.')
      }
      applyingRemote = true
      try {
        useBudgetStore.getState().resetLocalData()
      } finally {
        applyingRemote = false
      }
      clearMeta(userId)
      clearGuestDirty()
      writeOwner({ userId })
    } else {
      const local = syncSnapshot()
      const guest = readGuestDirty()
      const meta = readMeta(userId)
      // Se vuelve a leer todo para que la unión con la nube sea completa.
      meta.lastPulledAt = null
      meta.knownHistoryIds = []
      meta.historyRevs = {}
      meta.profileRev = 0
      meta.draftRevs = { budget: 0, quote: 0 }
      meta.syncedDeletions = []
      meta.resurrectedHistory = {}
      meta.dirty.profile = hasMeaningfulProfile(local) || guest.profile
      meta.dirty.draftBudget = hasMeaningfulBudget(local.budget) || guest.draftBudget
      meta.dirty.draftQuote = hasMeaningfulQuote(local.quote) || guest.draftQuote
      meta.profileMergePending = meta.dirty.profile
      writeMeta(meta)
      clearGuestDirty()
      writeOwner({ userId })
    }
    store.closeMerge()
    store.setPending(0)
    await syncNow('merge')
  } catch (error) {
    const syncStore = useSyncStore.getState()
    syncStore.setError(api.errorMessage(error))
    syncStore.setStatus(api.isOnline() ? 'error' : 'offline')
  } finally {
    useSyncStore.getState().setMergeBusy(false)
  }
}

export async function signIn(email: string): Promise<void> {
  const store = useSyncStore.getState()
  store.setError(null)
  try {
    await setupAuthListener()
    await api.signInWithEmail(email)
  } catch (error) {
    store.setError(authErrorMessage(error))
    store.setStatus('error')
    throw error
  }
}

/** Refresca el store tras un login con contraseña, sin depender del evento. */
async function adoptPasswordSession(): Promise<void> {
  const session = await api.getSession()
  if (session?.user) await handleSignedIn(session.user, 'PASSWORD_SIGNIN')
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const store = useSyncStore.getState()
  store.setError(null)
  try {
    // El listener debe existir antes de crear la sesión: si el evento
    // SIGNED_IN se dispara antes de suscribirse, la UI no se enteraría.
    await setupAuthListener()
    await api.signInWithPassword(email, password)
    await adoptPasswordSession()
  } catch (error) {
    store.setError(authErrorMessage(error))
    store.setStatus('error')
    throw error
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ needsConfirmation: boolean }> {
  const store = useSyncStore.getState()
  store.setError(null)
  try {
    await setupAuthListener()
    const result = await api.signUpWithPassword(email, password)
    if (!result.needsConfirmation) await adoptPasswordSession()
    return result
  } catch (error) {
    store.setError(authErrorMessage(error))
    store.setStatus('error')
    throw error
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const store = useSyncStore.getState()
  store.setError(null)
  try {
    await api.requestPasswordReset(email)
  } catch (error) {
    store.setError(authErrorMessage(error))
    store.setStatus('error')
    throw error
  }
}

export async function changePassword(password: string): Promise<void> {
  const store = useSyncStore.getState()
  store.setError(null)
  try {
    await api.updatePassword(password)
    clearAuthHash()
    toast.success('Contraseña actualizada.')
  } catch (error) {
    store.setError(authErrorMessage(error))
    throw error
  }
}

/**
 * Cierra la sesión. `clearLocal` borra también los datos del equipo (útil en
 * una computadora compartida); si no, quedan disponibles sin cuenta y el
 * próximo inicio de sesión de la misma persona los reconoce.
 */
async function waitForSync(): Promise<void> {
  if (!syncPromise) return
  try {
    await syncPromise
  } catch {
    // `doSync` ya convierte los errores en estado de la interfaz.
  }
}

export async function signOut(clearLocal: boolean): Promise<void> {
  accountClosing = true
  try {
    const user = useSyncStore.getState().user
    // Evita que una subida en curso repueble los datos después de borrarlos.
    await waitForSync()
    try {
      await api.signOutRemote()
    } catch {
      // `scope: local` ya limpió la sesión del navegador; si además falló la red,
      // no bloqueamos al usuario: puede seguir trabajando sin cuenta.
    }
    if (clearLocal) {
      applyingRemote = true
      try {
        useBudgetStore.getState().resetLocalData()
      } finally {
        applyingRemote = false
      }
      if (user) clearMeta(user.id)
      clearOwnerUser()
    }
    clearGuestDirty()
    handleSignedOut()
  } finally {
    accountClosing = false
  }
}

/** Borra la cuenta y todos sus datos (nube y equipo). */
export async function deleteAccount(): Promise<void> {
  const user = useSyncStore.getState().user
  if (!user) return
  accountClosing = true
  try {
    // Una subida a medias podría recrear filas después de borrar la cuenta.
    await waitForSync()
    await api.deleteRemoteAccount()
    applyingRemote = true
    try {
      useBudgetStore.getState().resetLocalData()
    } finally {
      applyingRemote = false
    }
    clearMeta(user.id)
    clearOwnerUser()
    clearGuestDirty()
    // El usuario ya no existe, pero la sesión local debe desaparecer igualmente.
    await api.signOutRemote().catch(() => {})
    handleSignedOut()
    toast.success('Cuenta y datos borrados.')
  } finally {
    accountClosing = false
  }
}

export async function syncNow(reason = 'manual'): Promise<void> {
  if (!SYNC_ENABLED) return
  const store = useSyncStore.getState()
  const user = store.user
  if (!user || store.mergeOpen || accountDecisionPending || accountClosing) return
  if (!api.isOnline()) {
    store.setStatus('offline')
    return
  }
  if (syncPromise) return syncPromise
  if (reason === 'focus' && store.pending === 0 && store.lastSyncedAt) {
    const last = Date.parse(store.lastSyncedAt)
    if (Number.isFinite(last) && Date.now() - last < 15_000) return
  }
  syncPromise = doSync(user, reason).finally(() => {
    syncPromise = null
  })
  return syncPromise
}

async function doSync(user: SyncUser, reason: string): Promise<void> {
  const store = useSyncStore.getState()
  store.setStatus('syncing')
  store.setError(null)
  let meta = readMeta(user.id)
  dirtyDuringSync.clear()

  try {
    // Si el almacenamiento local se vació a mano, el cursor incremental no
    // sirve: hay que volver a traer todo.
    if (!hasMeaningfulLocalData(syncSnapshot()) && meta.knownHistoryIds.length > 0) {
      meta = {
        ...meta,
        lastPulledAt: null,
        knownHistoryIds: [],
        historyRevs: {},
      }
      writeMeta(meta)
    }

    // Un id conocido que desapareció sin lápida explícita es más probable que
    // sea una pérdida local (almacenamiento corrupto) que un borrado. Se vuelve
    // a leer todo para restaurarlo en vez de borrarlo también de la nube.
    const localIds = new Set(
      useBudgetStore.getState().history.map((document) => document.id),
    )
    const lostWithoutTombstone = meta.knownHistoryIds.some(
      (id) => !localIds.has(id) && !(id in meta.deletedHistory),
    )
    if (lostWithoutTombstone) {
      meta = {
        ...meta,
        lastPulledAt: null,
        knownHistoryIds: [],
        historyRevs: {},
      }
      writeMeta(meta)
    }

    const remote = await api.pullRemote(user.id, meta.lastPulledAt)
    // La sesión pudo cerrarse o cambiar mientras se descargaba.
    if (accountClosing || useSyncStore.getState().user?.id !== user.id) return

    meta = applyRemoteSnapshot(meta, remote)
    writeMeta(meta)
    store.setPending(pendingCount(useBudgetStore.getState().history, meta))

    if (accountClosing || useSyncStore.getState().user?.id !== user.id) return
    meta = await pushLocal(user, meta)
    // Si llegó una edición justo al terminar la subida, se conserva la marca.
    meta = mergeStoredMeta(user.id, meta)
    meta.lastSyncedAt = new Date().toISOString()
    writeMeta(meta)

    const syncStore = useSyncStore.getState()
    syncStore.setLastSyncedAt(meta.lastSyncedAt)
    syncStore.setStatus('idle')
    syncStore.setError(null)
    const remaining = pendingCount(useBudgetStore.getState().history, meta)
    syncStore.setPending(remaining)
    if (remaining > 0) scheduleSync()
  } catch (error) {
    const message = api.errorMessage(error)
    const offline =
      !api.isOnline() || /network|fetch|timeout|failed to fetch/i.test(message)
    // No perder los cambios que se marcaron mientras fallaba la red.
    meta = mergeStoredMeta(user.id, meta)
    dirtyDuringSync.clear()
    writeMeta(meta)
    const syncStore = useSyncStore.getState()
    syncStore.setStatus(offline ? 'offline' : 'error')
    syncStore.setError(message)
    syncStore.setPending(
      pendingCount(useBudgetStore.getState().history, meta),
    )
    if (reason === 'manual') toast.error(message)
  }
}

function applyRemoteSnapshot(meta: SyncMeta, remote: RemoteSnapshot): SyncMeta {
  const fullPull = meta.lastPulledAt === null
  // Recoge lo que haya cambiado mientras se descargaba: una edición, un
  // borrado o un «deshacer» hechos durante el pull no deben perderse.
  meta = mergeStoredMeta(meta.userId, meta)
  const state = useBudgetStore.getState()
  const next: SyncMeta = {
    ...meta,
    dirty: { ...meta.dirty },
    draftRevs: { ...meta.draftRevs },
    historyRevs: { ...meta.historyRevs },
    knownHistoryIds: [...meta.knownHistoryIds],
    deletedHistory: { ...meta.deletedHistory },
    syncedDeletions: [...meta.syncedDeletions],
  }
  const patch: Partial<PersistedState> = {}
  const conflicts: SavedDocument[] = []
  const warnings: string[] = []

  const profileMeaningful = hasMeaningfulProfile(state)
  const budgetMeaningful = hasMeaningfulBudget(state.budget)
  const quoteMeaningful = hasMeaningfulQuote(state.quote)

  // ── Perfil (empresa, catálogo, preferencias) ─────────────────────────
  if (remote.profile) {
    const shouldApply =
      isNewer(remote.profile.updated_at, meta.lastPulledAt) ||
      !profileMeaningful ||
      next.profileMergePending
    if (shouldApply) {
      const profile = parseProfilePayload(remote.profile.payload)
      if (!profile) {
        warnings.push('El perfil de la nube no tiene un formato válido.')
        next.profileMergePending = false
        if (profileMeaningful) next.dirty.profile = true
      } else if (
        (next.profileMergePending || next.dirty.profile) &&
        profileMeaningful
      ) {
        // Cambiaron las dos partes: se mezclan empresa y catálogo campo a campo
        // en lugar de descartar una de las dos versiones.
        const localProfile = profileFromState(state)
        const merged = mergeProfiles(localProfile, profile)
        const validated = syncProfileSchema.safeParse(merged)
        if (validated.success) {
          Object.assign(patch, profileToStatePatch(validated.data))
          next.profileRev = remote.profile.rev
          next.dirty.profile = JSON.stringify(validated.data) !== JSON.stringify(localProfile)
          next.profileMergePending = false
          toast.info('Se combinaron los datos de empresa de este equipo y la nube.', {
            id: 'sync-profile-merge',
          })
        } else {
          warnings.push(
            'No se pudieron combinar los datos de empresa; se conservó la copia de este equipo.',
          )
          next.profileMergePending = false
          next.dirty.profile = true
        }
      } else {
        Object.assign(patch, profileToStatePatch(profile))
        next.profileRev = remote.profile.rev
        next.dirty.profile = false
        next.profileMergePending = false
      }
    }
  } else {
    next.profileMergePending = false
    if (profileMeaningful) next.dirty.profile = true
  }

  // ── Borradores ───────────────────────────────────────────────────────
  for (const mode of ['budget', 'quote'] as const) {
    const row = remote.drafts.find((draft) => draft.mode === mode)
    const localMeaningful = mode === 'budget' ? budgetMeaningful : quoteMeaningful
    const dirty = mode === 'budget' ? next.dirty.draftBudget : next.dirty.draftQuote
    const localDocument = mode === 'budget' ? state.budget : state.quote

    const setDirty = (value: boolean) => {
      if (mode === 'budget') next.dirty.draftBudget = value
      else next.dirty.draftQuote = value
    }

    if (!row) {
      setDirty(localMeaningful)
      continue
    }

    if (!isNewer(row.updated_at, meta.lastPulledAt) && localMeaningful) continue

    const document = parseDraftPayload(row.payload, mode)
    if (!document) {
      warnings.push(
        `El borrador de ${
          mode === 'budget' ? 'presupuesto' : 'cotización'
        } de la nube no es válido.`,
      )
      continue
    }

    if (JSON.stringify(document) === JSON.stringify(localDocument)) {
      setDirty(false)
      next.draftRevs[mode] = row.rev
      continue
    }

    if (dirty && localMeaningful) {
      // El borrador local es el que la persona está viendo: se queda, y la
      // versión remota se archiva para no perderla.
      conflicts.push(conflictDocument(mode, document, 'otro equipo'))
      next.draftRevs[mode] = row.rev
      warnings.push(
        'Se recibió un borrador distinto desde otro equipo; se guardó una copia en el historial.',
      )
      continue
    }

    if (mode === 'budget') {
      patch.budget = document as Budget
    } else {
      patch.quote = document as Quote
    }
    setDirty(false)
    next.draftRevs[mode] = row.rev
  }

  // ── Historial ────────────────────────────────────────────────────────
  const localIds = new Set(state.history.map((document) => document.id))

  // Deshacer un borrado: si el documento volvió al historial, se quita su
  // lápida local **antes** de aplicar las lápidas nuevas que vengan de la nube.
  for (const id of Object.keys(next.deletedHistory)) {
    if (localIds.has(id)) {
      delete next.deletedHistory[id]
      next.syncedDeletions = next.syncedDeletions.filter((synced) => synced !== id)
      next.knownHistoryIds = next.knownHistoryIds.filter((known) => known !== id)
      next.resurrectedHistory[id] = new Date().toISOString()
    }
  }

  const remoteDeleted = new Set<string>()
  const remoteActive: SavedDocument[] = []
  for (const row of remote.documents) {
    if (row.deleted_at) {
      // Si la persona deshizo el borrado después de que se creara esta lápida,
      // la restauración local gana y el documento se vuelve a subir activo.
      if (next.resurrectedHistory[row.id]) {
        // La restauración local es explícita y gana; el documento se re-sube
        // activo. Así una lápida anterior (o un reloj desfasado) no la anula.
        next.knownHistoryIds = next.knownHistoryIds.filter(
          (known) => known !== row.id,
        )
        continue
      }
      remoteDeleted.add(row.id)
      next.deletedHistory[row.id] = next.deletedHistory[row.id] ?? row.updated_at
      delete next.resurrectedHistory[row.id]
      next.syncedDeletions.push(row.id)
      delete next.historyRevs[row.id]
      continue
    }
    const document = parseRemoteDocument(row)
    if (!document) {
      warnings.push('Un documento de la nube no tiene un formato válido y se omitió.')
      continue
    }
    remoteActive.push(document)
    next.historyRevs[row.id] = row.rev
  }

  const deletedIds = new Set([
    ...Object.keys(next.deletedHistory),
    ...remoteDeleted,
  ])
  const merged = mergeHistory(
    [...conflicts, ...state.history],
    remoteActive,
    deletedIds,
  )
  patch.history = merged.history

  for (const id of merged.removedIds) {
    next.deletedHistory[id] = next.deletedHistory[id] ?? new Date().toISOString()
    delete next.resurrectedHistory[id]
    next.knownHistoryIds = next.knownHistoryIds.filter((known) => known !== id)
    delete next.historyRevs[id]
    if (!remoteDeleted.has(id)) {
      // Descartado por el tope: hay que borrarlo también en la nube.
      next.syncedDeletions = next.syncedDeletions.filter((synced) => synced !== id)
    }
  }

  if (merged.droppedByLimit > 0) {
    warnings.push(
      `Se conservaron los ${HISTORY_LIMIT} documentos más recientes del historial.`,
    )
  }

  const keptIds = new Set(merged.history.map((document) => document.id))
  const remoteActiveIds = new Set(remoteActive.map((document) => document.id))
  next.knownHistoryIds = [
    ...new Set([...next.knownHistoryIds, ...merged.appliedRemoteIds]),
  ].filter(
    (id) =>
      !deletedIds.has(id) &&
      // En un pull completo solo son conocidos los que existen en la nube y
      // siguen en el historial. En uno incremental se conserva el resto para
      // restaurarlo en el siguiente ciclo.
      (!fullPull || (remoteActiveIds.has(id) && keptIds.has(id))),
  )

  // ── Aplicar el estado validado ───────────────────────────────────────
  if (Object.keys(patch).length > 0) {
    applyingRemote = true
    try {
      useBudgetStore.getState().applyRemoteState(patch)
    } finally {
      applyingRemote = false
    }
  }

  // El correlativo nunca puede quedar por debajo de una cotización ya emitida.
  const afterApply = useBudgetStore.getState()
  const desiredCounter = Math.max(
    afterApply.quoteCounter,
    maxQuoteCounter(afterApply.history),
    quoteNumberValue(afterApply.quote.number),
  )
  if (desiredCounter !== afterApply.quoteCounter) {
    applyingRemote = true
    try {
      useBudgetStore.getState().applyRemoteState({ quoteCounter: desiredCounter })
    } finally {
      applyingRemote = false
    }
    next.dirty.profile = true
  }

  const duplicates = duplicateQuoteNumbers(afterApply.history)
  if (duplicates.length > 0) {
    toast.warning(
      `Hay números de cotización repetidos: ${duplicates.join(', ')}. Revisa el historial antes de emitir otro.`,
      { id: 'sync-duplicate-quotes' },
    )
  }

  if (warnings.length > 0) {
    toast.warning(warnings[0], {
      id: 'sync-warning',
      description:
        warnings.length > 1 ? `${warnings.length} avisos de sincronización.` : undefined,
    })
  }

  const timestamps = [
    remote.profile?.updated_at,
    ...remote.drafts.map((draft) => draft.updated_at),
    ...remote.documents.map((document) => document.updated_at),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)
  for (const timestamp of timestamps) {
    next.lastPulledAt = maxTimestamp(next.lastPulledAt, timestamp)
  }

  return next
}

async function pushLocal(user: SyncUser, meta: SyncMeta): Promise<SyncMeta> {
  const before = useBudgetStore.getState()
  const snapshot = syncSnapshot()
  const next: SyncMeta = {
    ...meta,
    dirty: { ...meta.dirty },
    draftRevs: { ...meta.draftRevs },
    historyRevs: { ...meta.historyRevs },
    knownHistoryIds: [...meta.knownHistoryIds],
    deletedHistory: { ...meta.deletedHistory },
    syncedDeletions: [...meta.syncedDeletions],
  }

  if (next.dirty.profile) {
    const validated = syncProfileSchema.safeParse(profileFromState(snapshot))
    if (!validated.success) {
      throw new Error(
        'Los datos de empresa o del catálogo no tienen un formato válido para sincronizarlos.',
      )
    }
    const profilePayload = JSON.stringify(validated.data)
    if (profilePayload.length > 4_000_000) {
      throw new Error(
        'Los datos de empresa (logo, firma o sello) son demasiado grandes para sincronizarlos. Reduce el tamaño de las imágenes.',
      )
    }
    const result = await api.upsertProfile(user.id, profilePayload)
    next.profileRev = result.rev
    next.dirty.profile = false
    next.profileMergePending = false
    next.lastPulledAt = maxTimestamp(next.lastPulledAt, result.updated_at)
  }

  for (const mode of ['budget', 'quote'] as const) {
    const dirty =
      mode === 'budget' ? next.dirty.draftBudget : next.dirty.draftQuote
    if (!dirty) continue
    const payload =
      mode === 'budget' ? budgetDraftPayload(snapshot) : quoteDraftPayload(snapshot)
    const result = await api.upsertDraft(user.id, mode, payload)
    next.draftRevs[mode] = result.rev
    if (mode === 'budget') next.dirty.draftBudget = false
    else next.dirty.draftQuote = false
    next.lastPulledAt = maxTimestamp(next.lastPulledAt, result.updated_at)
  }

  const diff = historyDiff(snapshot.history, next)
  for (const document of diff.toPush) {
    const result = await api.upsertDocument(user.id, document)
    next.historyRevs[document.id] = result.rev
    next.knownHistoryIds.push(document.id)
    delete next.resurrectedHistory[document.id]
    next.lastPulledAt = maxTimestamp(next.lastPulledAt, result.updated_at)
  }

  for (const id of diff.toDelete) {
    const result = await api.deleteDocumentRemote(user.id, id)
    if (result) next.lastPulledAt = maxTimestamp(next.lastPulledAt, result.updated_at)
    next.deletedHistory[id] = next.deletedHistory[id] ?? new Date().toISOString()
    delete next.resurrectedHistory[id]
    next.syncedDeletions.push(id)
    next.knownHistoryIds = next.knownHistoryIds.filter((known) => known !== id)
    delete next.historyRevs[id]
  }

  // Si la persona siguió editando mientras se subía, hay que volver a marcar
  // esas partes para que el próximo ciclo las envíe. Las referencias del store
  // son inmutables, así que comparar identidad es suficiente y barato.
  const after = useBudgetStore.getState()
  if (
    after.clinic !== before.clinic ||
    after.catalog !== before.catalog ||
    after.savedBudgetNotes !== before.savedBudgetNotes ||
    after.savedQuoteTerms !== before.savedQuoteTerms ||
    after.pageSize !== before.pageSize ||
    after.quotePageSize !== before.quotePageSize ||
    after.rateMode !== before.rateMode ||
    after.quoteCounter !== before.quoteCounter
  ) {
    next.dirty.profile = true
  }
  if (after.budget !== before.budget) next.dirty.draftBudget = true
  if (after.quote !== before.quote) next.dirty.draftQuote = true

  for (const slice of dirtyDuringSync) next.dirty[slice] = true
  dirtyDuringSync.clear()

  const merged = mergeStoredMeta(user.id, next)
  merged.knownHistoryIds = [...new Set(merged.knownHistoryIds)]
  merged.syncedDeletions = [...new Set(merged.syncedDeletions)]
  writeMeta(merged)
  return merged
}
