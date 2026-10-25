import type { SavedDocument } from '@/types'
import type { SyncMeta } from './types'

export interface HistoryDiff {
  /** Documentos locales que aún no existen en la nube. */
  toPush: SavedDocument[]
  /** Ids borrados localmente que aún no se comunicaron al servidor. */
  toDelete: string[]
}

/** Diferencia entre el historial local y lo que ya se sincronizó. */
export function historyDiff(local: SavedDocument[], meta: SyncMeta): HistoryDiff {
  const known = new Set(meta.knownHistoryIds)
  const deleted = new Set(Object.keys(meta.deletedHistory))
  const synced = new Set(meta.syncedDeletions)
  return {
    toPush: local.filter((document) => !known.has(document.id) && !deleted.has(document.id)),
    // Solo se borran ids con lápida explícita. Si un id conocido desaparece del
    // historial sin lápida, se trata como pérdida local y se vuelve a leer de
    // la nube en lugar de borrarlo también allí.
    toDelete: [...deleted].filter((id) => !synced.has(id)),
  }
}

/** Número de operaciones pendientes (para el indicador de la cuenta). */
export function pendingCount(local: SavedDocument[], meta: SyncMeta): number {
  const diff = historyDiff(local, meta)
  const localIds = new Set(local.map((document) => document.id))
  const missing = meta.knownHistoryIds.filter(
    (id) => !localIds.has(id) && !(id in meta.deletedHistory),
  )
  const dirty =
    Number(meta.dirty.profile) +
    Number(meta.dirty.draftBudget) +
    Number(meta.dirty.draftQuote)
  return diff.toPush.length + diff.toDelete.length + missing.length + dirty
}
