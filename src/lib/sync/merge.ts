import { z } from 'zod'
import { migrateCatalogDefaults } from '@/data/catalog'
import {
  DEFAULT_CLINIC,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUOTE_PAGE_SIZE,
  quoteNumberValue,
} from '@/data/defaults'
import { isDefaultClinic } from './localData'
import {
  MAX_NOTES,
  budgetSchema,
  catalogSchema,
  clinicSchema,
  quoteSchema,
  savedBudgetSchema,
  savedQuoteSchema,
} from '@/lib/io'
import { newId } from '@/lib/ids'
import { HISTORY_LIMIT, LIMITS } from '@/lib/limits'
import type { Budget, DocMode, Quote, SavedDocument } from '@/types'
import type {
  RemoteDocumentRow,
  SyncDraftPayload,
  SyncProfile,
  SyncProfileSource,
} from './types'

const pageSizeSchema = z.enum(['A4', 'Letter', 'Legal'])

export const syncProfileSchema = z.object({
  version: z.literal(1),
  clinic: clinicSchema,
  catalog: catalogSchema,
  savedBudgetNotes: z
    .array(z.string().max(LIMITS.note))
    .max(MAX_NOTES)
    .nullable(),
  savedQuoteTerms: z.string().max(LIMITS.quoteTerms).nullable(),
  pageSize: pageSizeSchema,
  quotePageSize: pageSizeSchema,
  rateMode: z.enum(['auto', 'manual']),
  quoteCounter: z.number().int().min(1).max(1_000_000_000),
})

const syncDraftSchema = z.object({
  version: z.literal(1),
  budget: budgetSchema.optional(),
  quote: quoteSchema.optional(),
})

export type SyncProfilePatch = Omit<SyncProfile, 'version'>

/** Construye el registro `profiles` a partir del estado local. */
export function profileFromState(state: SyncProfileSource): SyncProfile {
  return {
    version: 1,
    clinic: state.clinic,
    catalog: state.catalog,
    savedBudgetNotes: state.savedBudgetNotes,
    savedQuoteTerms: state.savedQuoteTerms,
    pageSize: state.pageSize,
    quotePageSize: state.quotePageSize,
    rateMode: state.rateMode,
    quoteCounter: state.quoteCounter,
  }
}

/** Valida el perfil remoto antes de tocar el estado local. */
export function parseProfilePayload(payload: string): SyncProfile | null {
  try {
    const result = syncProfileSchema.safeParse(JSON.parse(payload))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Aplica el catálogo remoto al modelo actual sin perder servicios/productos
 * nuevos de la versión instalada.
 */
export function profileToStatePatch(profile: SyncProfile): SyncProfilePatch {
  return {
    clinic: profile.clinic,
    catalog: migrateCatalogDefaults(profile.catalog, { seedProducts: false }),
    savedBudgetNotes: profile.savedBudgetNotes,
    savedQuoteTerms: profile.savedQuoteTerms,
    pageSize: profile.pageSize,
    quotePageSize: profile.quotePageSize,
    rateMode: profile.rateMode,
    quoteCounter: profile.quoteCounter,
  }
}

function mergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
  limit: number,
): T[] {
  const localIds = new Set(local.map((item) => item.id))
  return [...local, ...remote.filter((item) => !localIds.has(item.id))].slice(0, limit)
}

function uniqueStrings(local: string[], remote: string[], limit: number): string[] {
  return [...new Set([...local, ...remote])].slice(0, limit)
}

/**
 * Combina dos perfiles cuando se adopta el equipo de otra cuenta.
 *
 * No se puede elegir «gana uno» sin perder algo: el historial se une, pero la
 * empresa y el catálogo se mezclan por campo/id. Lo local tiene prioridad
 * cuando hay conflicto; lo que solo existe en la nube se conserva.
 */
export function mergeProfiles(local: SyncProfile, remote: SyncProfile): SyncProfile {
  const clinic = isDefaultClinic(local.clinic)
    ? remote.clinic
    : {
        name:
          local.clinic.name === DEFAULT_CLINIC.name
            ? remote.clinic.name
            : local.clinic.name,
        rif:
          local.clinic.rif === DEFAULT_CLINIC.rif
            ? remote.clinic.rif
            : local.clinic.rif,
        address: local.clinic.address || remote.clinic.address,
        phone: local.clinic.phone || remote.clinic.phone,
        email: local.clinic.email || remote.clinic.email,
        logoDataUrl: local.clinic.logoDataUrl ?? remote.clinic.logoDataUrl,
        headerMode: local.clinic.headerMode,
        doctorTitle: local.clinic.doctorTitle ?? remote.clinic.doctorTitle,
        specialtyId: local.clinic.specialtyId ?? remote.clinic.specialtyId,
        doctorName: local.clinic.doctorName || remote.clinic.doctorName,
        doctorId: local.clinic.doctorId || remote.clinic.doctorId,
        signatureDataUrl:
          local.clinic.signatureDataUrl ?? remote.clinic.signatureDataUrl,
        sealDataUrl: local.clinic.sealDataUrl ?? remote.clinic.sealDataUrl,
        showSignature: local.clinic.showSignature ?? remote.clinic.showSignature,
      }

  return {
    version: 1,
    clinic,
    catalog: {
      categories: uniqueStrings(
        local.catalog.categories,
        remote.catalog.categories,
        80,
      ),
      services: mergeById(local.catalog.services, remote.catalog.services, 500),
      packs: mergeById(local.catalog.packs, remote.catalog.packs, 100),
      specialties: mergeById(
        local.catalog.specialties,
        remote.catalog.specialties,
        50,
      ),
      products: mergeById(local.catalog.products, remote.catalog.products, 500),
      productCatalogVersion: Math.max(
        local.catalog.productCatalogVersion ?? 1,
        remote.catalog.productCatalogVersion ?? 1,
      ),
    },
    savedBudgetNotes: local.savedBudgetNotes ?? remote.savedBudgetNotes,
    savedQuoteTerms: local.savedQuoteTerms ?? remote.savedQuoteTerms,
    pageSize:
      local.pageSize === DEFAULT_PAGE_SIZE && remote.pageSize !== DEFAULT_PAGE_SIZE
        ? remote.pageSize
        : local.pageSize,
    quotePageSize:
      local.quotePageSize === DEFAULT_QUOTE_PAGE_SIZE &&
      remote.quotePageSize !== DEFAULT_QUOTE_PAGE_SIZE
        ? remote.quotePageSize
        : local.quotePageSize,
    rateMode: local.rateMode,
    quoteCounter: Math.max(local.quoteCounter, remote.quoteCounter),
  }
}

/** Reconstruye una entrada del historial desde una fila de `documents`. */
export function parseRemoteDocument(row: RemoteDocumentRow): SavedDocument | null {
  if (row.enc) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(row.payload)
  } catch {
    return null
  }
  if (row.kind === 'budget') {
    const result = savedBudgetSchema.safeParse(parsed)
    if (!result.success) return null
    return { ...result.data, id: row.id, savedAt: row.saved_at }
  }
  const result = savedQuoteSchema.safeParse(parsed)
  if (!result.success) return null
  return { ...result.data, id: row.id, savedAt: row.saved_at }
}

export interface HistoryMergeResult {
  history: SavedDocument[]
  /** Ids que deben quedar borrados (también en la nube). */
  removedIds: string[]
  /** Ids remotos que siguen presentes y ya se pueden dar por conocidos. */
  appliedRemoteIds: string[]
  /** Cuántos se descartaron por el tope de 100. */
  droppedByLimit: number
}

function byNewest(a: SavedDocument, b: SavedDocument): number {
  const diff = Date.parse(b.savedAt) - Date.parse(a.savedAt)
  return Number.isFinite(diff) && diff !== 0 ? diff : a.id.localeCompare(b.id)
}

/**
 * Une historial local y remoto sin perder información:
 *  - las lápidas mandan (un documento borrado no resucita);
 *  - los documentos son inmutables y se identifican por id;
 *  - si la unión pasa de 100, se descartan los más antiguos y se devuelven
 *    para comunicar el borrado a la nube.
 */
export function mergeHistory(
  local: SavedDocument[],
  remoteActive: SavedDocument[],
  deletedIds: ReadonlySet<string>,
  limit = HISTORY_LIMIT,
): HistoryMergeResult {
  const map = new Map<string, SavedDocument>()
  const removed = new Set<string>()
  for (const document of local) map.set(document.id, document)

  for (const id of deletedIds) {
    if (map.delete(id)) removed.add(id)
  }

  const appliedRemoteIds: string[] = []
  for (const document of remoteActive) {
    if (deletedIds.has(document.id)) {
      if (map.delete(document.id)) removed.add(document.id)
      continue
    }
    const existing = map.get(document.id)
    if (!existing) map.set(document.id, document)
    appliedRemoteIds.push(document.id)
  }

  const sorted = [...map.values()].sort(byNewest)
  const dropped = sorted.slice(limit)
  for (const document of dropped) removed.add(document.id)

  const kept = sorted.slice(0, limit)
  const remoteIds = new Set(appliedRemoteIds)
  return {
    history: kept,
    removedIds: [...removed],
    appliedRemoteIds: kept
      .filter((document) => remoteIds.has(document.id))
      .map((document) => document.id),
    droppedByLimit: dropped.length,
  }
}

export function budgetDraftPayload(state: { budget: Budget }): SyncDraftPayload {
  return { version: 1, budget: state.budget }
}

export function quoteDraftPayload(state: { quote: Quote }): SyncDraftPayload {
  return { version: 1, quote: state.quote }
}

/** Valida el borrador remoto; devuelve solo el documento del modo pedido. */
export function parseDraftPayload(
  payload: string,
  mode: DocMode,
): Budget | Quote | null {
  try {
    const result = syncDraftSchema.safeParse(JSON.parse(payload))
    if (!result.success) return null
    return mode === 'budget' ? (result.data.budget ?? null) : (result.data.quote ?? null)
  } catch {
    return null
  }
}

/**
 * Convierte una copia perdedora en una entrada del historial, con una nota que
 * explica de dónde salió. Así un conflicto nunca borra trabajo.
 */
export function conflictDocument(
  mode: DocMode,
  document: Budget | Quote,
  sourceLabel: string,
): SavedDocument {
  const note = `Copia en conflicto recibida de ${sourceLabel}.`
  const savedAt = new Date().toISOString()
  if (mode === 'budget') {
    const budget = document as Budget
    const notes = [...budget.notes]
    if (notes.length >= MAX_NOTES) notes.splice(0, notes.length - MAX_NOTES + 1)
    notes.push(note)
    return {
      id: newId('saved'),
      savedAt,
      kind: 'budget',
      budget: { ...budget, notes },
    }
  }
  const quote = document as Quote
  // La nota va al final y se conserva aunque las condiciones ya estén al límite.
  const suffix = `\n${note}`
  const base = (quote.terms ?? '').slice(
    0,
    Math.max(0, LIMITS.quoteTerms - suffix.length),
  )
  const terms = `${base}${suffix}`.slice(0, LIMITS.quoteTerms)
  return {
    id: newId('saved'),
    savedAt,
    kind: 'quote',
    quote: { ...quote, terms },
  }
}

/** Números de cotización repetidos (pueden coincidir si dos equipos trabajan offline). */
export function duplicateQuoteNumbers(history: SavedDocument[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const document of history) {
    if (document.kind !== 'quote') continue
    const number = document.quote.number.trim()
    if (!number) continue
    if (seen.has(number)) duplicates.add(number)
    else seen.add(number)
  }
  return [...duplicates]
}

/** Correlativo máximo que ya se usó en el historial. */
export function maxQuoteCounter(history: SavedDocument[]): number {
  let max = 1
  for (const document of history) {
    if (document.kind === 'quote') {
      max = Math.max(max, quoteNumberValue(document.quote.number))
    }
  }
  return max
}
