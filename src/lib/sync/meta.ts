import type { SyncMeta } from './types'

const META_PREFIX = 'budgetify:sync:v1:'
const MAX_IDS = 200

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function syncMetaKey(userId: string): string {
  return `${META_PREFIX}${userId}`
}

export function createMeta(userId: string): SyncMeta {
  return {
    version: 1,
    userId,
    lastPulledAt: null,
    lastSyncedAt: null,
    dirty: {
      profile: false,
      draftBudget: false,
      draftQuote: false,
    },
    profileMergePending: false,
    profileRev: 0,
    draftRevs: { budget: 0, quote: 0 },
    historyRevs: {},
    knownHistoryIds: [],
    deletedHistory: {},
    syncedDeletions: [],
    resurrectedHistory: {},
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, MAX_IDS)
    : []
}

function asRecordOfStrings(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .slice(0, MAX_IDS)
  return Object.fromEntries(entries)
}

function asRecordOfNumbers(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]),
    )
    .slice(0, MAX_IDS)
  return Object.fromEntries(entries)
}

function positiveInt(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : fallback
}

function isoTimestamp(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** Lee y sanea los metadatos; si están corruptos vuelve a un estado vacío. */
export function readMeta(userId: string): SyncMeta {
  const base = createMeta(userId)
  const store = storage()
  if (!store) return base
  try {
    const raw = store.getItem(syncMetaKey(userId))
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<SyncMeta>
    if (!parsed || typeof parsed !== 'object' || parsed.userId !== userId) return base
    const dirty =
      parsed.dirty && typeof parsed.dirty === 'object'
        ? (parsed.dirty as Partial<SyncMeta['dirty']>)
        : {}
    const draftRevs =
      parsed.draftRevs && typeof parsed.draftRevs === 'object'
        ? (parsed.draftRevs as Partial<SyncMeta['draftRevs']>)
        : {}
    return {
      ...base,
      lastPulledAt: isoTimestamp(parsed.lastPulledAt),
      lastSyncedAt: isoTimestamp(parsed.lastSyncedAt),
      dirty: {
        profile: dirty.profile === true,
        draftBudget: dirty.draftBudget === true,
        draftQuote: dirty.draftQuote === true,
      },
      profileMergePending: parsed.profileMergePending === true,
      profileRev: positiveInt(parsed.profileRev, 0),
      draftRevs: {
        budget: positiveInt(draftRevs.budget, 0),
        quote: positiveInt(draftRevs.quote, 0),
      },
      historyRevs: asRecordOfNumbers(parsed.historyRevs),
      knownHistoryIds: asStringArray(parsed.knownHistoryIds),
      deletedHistory: asRecordOfStrings(parsed.deletedHistory),
      syncedDeletions: asStringArray(parsed.syncedDeletions),
      resurrectedHistory: asRecordOfStrings(parsed.resurrectedHistory),
    }
  } catch {
    return base
  }
}

export function writeMeta(meta: SyncMeta): void {
  try {
    storage()?.setItem(syncMetaKey(meta.userId), JSON.stringify(meta))
  } catch {
    // Cuota llena o modo privado: la sincronización fallará y se avisará, pero
    // editar y guardar localmente debe seguir funcionando.
  }
}

export function updateMeta(
  userId: string,
  updater: (meta: SyncMeta) => SyncMeta,
): SyncMeta {
  const next = updater(readMeta(userId))
  writeMeta(next)
  return next
}

export function clearMeta(userId: string): void {
  try {
    storage()?.removeItem(syncMetaKey(userId))
  } catch {
    // Nada que limpiar.
  }
}
