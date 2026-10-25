import type {
  Budget,
  Catalog,
  Clinic,
  DocMode,
  PageSize,
  Quote,
  RateMode,
  SavedDocument,
} from '@/types'

/** Estado local que viaja en el registro `profiles`. */
export interface SyncProfileSource {
  clinic: Clinic
  catalog: Catalog
  savedBudgetNotes: string[] | null
  savedQuoteTerms: string | null
  pageSize: PageSize
  quotePageSize: PageSize
  rateMode: RateMode
  quoteCounter: number
}

export interface SyncProfile extends SyncProfileSource {
  version: 1
}

/** Lo que se sincroniza del borrador en curso. */
export interface SyncDraftSource {
  budget: Budget
  quote: Quote
}

export interface SyncLocalSnapshot extends SyncProfileSource, SyncDraftSource {
  history: SavedDocument[]
}

export interface RemoteProfileRow {
  user_id: string
  payload: string
  enc: boolean
  iv: string | null
  alg: string | null
  rev: number
  updated_at: string
}

export interface RemoteDocumentRow {
  user_id: string
  id: string
  kind: DocMode
  payload: string
  enc: boolean
  iv: string | null
  alg: string | null
  saved_at: string
  updated_at: string
  deleted_at: string | null
  rev: number
}

export interface RemoteDraftRow {
  user_id: string
  mode: DocMode
  payload: string
  enc: boolean
  iv: string | null
  alg: string | null
  rev: number
  updated_at: string
}

export interface RemoteSnapshot {
  profile: RemoteProfileRow | null
  documents: RemoteDocumentRow[]
  drafts: RemoteDraftRow[]
}

export interface RemoteWriteResult {
  rev: number
  updated_at: string
}

export interface SyncUser {
  id: string
  email: string | null
}

export type SyncStatus =
  | 'disabled'
  | 'signed-out'
  | 'idle'
  | 'syncing'
  | 'offline'
  | 'error'

export type MergeStrategy = 'merge' | 'cloud'

/**
 * Metadatos locales de sincronización de una cuenta.
 *
 * No contiene los datos: el estado real sigue en `budgetify:v1`. Aquí solo se
 * apunta qué cambió, qué ids ya se sincronizaron y qué borrados están
 * pendientes. Así el estado local es la propia cola y no hace falta duplicar
 * presupuestos en IndexedDB.
 */
export interface SyncMeta {
  version: 1
  userId: string
  lastPulledAt: string | null
  lastSyncedAt: string | null
  dirty: {
    profile: boolean
    draftBudget: boolean
    draftQuote: boolean
  }
  /**
   * El próximo perfil remoto debe combinarse campo a campo con el local en
   * lugar de dejar que gane uno de los dos. Se activa al adoptar los datos de
   * otra cuenta en este equipo.
   */
  profileMergePending: boolean
  profileRev: number
  draftRevs: {
    budget: number
    quote: number
  }
  historyRevs: Record<string, number>
  /** Ids que ya existen en la nube (para no volver a subirlos). */
  knownHistoryIds: string[]
  /** Ids borrados localmente y cuándo. */
  deletedHistory: Record<string, string>
  /** Borrados que ya se comunicaron al servidor. */
  syncedDeletions: string[]
  /**
   * Ids que se restauraron con «Deshacer» y todavía no se han vuelto a subir.
   * Sirve para ignorar una lápida remota anterior a la restauración local.
   */
  resurrectedHistory: Record<string, string>
}

export interface SyncDraftPayload {
  version: 1
  budget?: Budget
  quote?: Quote
}
