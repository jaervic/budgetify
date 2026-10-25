import { describe, expect, it } from 'vitest'
import { cloneDefaultClinic, createEmptyBudget, createEmptyQuote } from '@/data/defaults'
import type { Budget, Quote, SavedDocument } from '@/types'
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
  quoteDraftPayload,
} from './merge'
import type { RemoteDocumentRow, SyncProfileSource } from './types'

function profileSource(overrides: Partial<SyncProfileSource> = {}): SyncProfileSource {
  return {
    clinic: cloneDefaultClinic(),
    catalog: {
      categories: ['Honorarios Médicos'],
      services: [],
      packs: [],
      specialties: [],
      products: [],
    },
    savedBudgetNotes: null,
    savedQuoteTerms: null,
    pageSize: 'A4',
    quotePageSize: 'Letter',
    rateMode: 'auto',
    quoteCounter: 1,
    ...overrides,
  }
}

function budget(name: string, issueDate = '2026-10-01'): Budget {
  return {
    ...createEmptyBudget(),
    patient: { name },
    issueDate,
  }
}

function quote(number: string, name: string): Quote {
  return { ...createEmptyQuote(number), client: { name } }
}

function savedBudget(id: string, savedAt: string, name: string): SavedDocument {
  return { id, savedAt, kind: 'budget', budget: budget(name, savedAt.slice(0, 10)) }
}

function savedQuote(id: string, savedAt: string, number: string, name: string): SavedDocument {
  return { id, savedAt, kind: 'quote', quote: quote(number, name) }
}

function row(document: SavedDocument, overrides: Partial<RemoteDocumentRow> = {}): RemoteDocumentRow {
  return {
    user_id: 'user-1',
    id: document.id,
    kind: document.kind,
    payload: JSON.stringify(document),
    enc: false,
    iv: null,
    alg: null,
    saved_at: document.savedAt,
    updated_at: document.savedAt,
    deleted_at: null,
    rev: 1,
    ...overrides,
  }
}

describe('perfil remoto', () => {
  it('hace ida y vuelta por JSON sin perder campos', () => {
    const source = profileSource({ quoteCounter: 42, rateMode: 'manual' })
    const parsed = parseProfilePayload(JSON.stringify(profileFromState(source)))
    expect(parsed).not.toBeNull()
    expect(parsed?.quoteCounter).toBe(42)
    expect(parsed?.rateMode).toBe('manual')
    expect(parsed?.clinic.name).toBe(source.clinic.name)
  })

  it('rechaza un perfil corrupto o de otra versión', () => {
    expect(parseProfilePayload('{')).toBeNull()
    expect(parseProfilePayload(JSON.stringify({ version: 2 }))).toBeNull()
    expect(parseProfilePayload(JSON.stringify({ version: 1, clinic: {} }))).toBeNull()
  })
})

describe('mergeProfiles', () => {
  it('mezcla empresa y catálogo sin perder lo que solo está en la nube', () => {
    const local = profileFromState(
      profileSource({
        clinic: { ...cloneDefaultClinic(), name: 'Clínica local' },
        catalog: {
          categories: ['Local'],
          services: [
            {
              id: 'svc_local',
              category: 'Local',
              concept: 'Local',
              formula: { type: 'fixed', amountUsd: 10 },
            },
          ],
          packs: [],
          specialties: [],
          products: [],
        },
        savedBudgetNotes: null,
        quoteCounter: 3,
      }),
    )
    const remote = profileFromState(
      profileSource({
        clinic: {
          ...cloneDefaultClinic(),
          name: 'Clínica remota',
          address: 'Calle 1',
          logoDataUrl: 'data:image/png;base64,AAAA',
        },
        catalog: {
          categories: ['Remoto'],
          services: [
            {
              id: 'svc_remote',
              category: 'Remoto',
              concept: 'Remoto',
              formula: { type: 'fixed', amountUsd: 20 },
            },
          ],
          packs: [],
          specialties: [],
          products: [],
        },
        savedBudgetNotes: ['Nota remota'],
        quoteCounter: 9,
      }),
    )

    const merged = mergeProfiles(local, remote)
    expect(merged.clinic.name).toBe('Clínica local')
    expect(merged.clinic.address).toBe('Calle 1')
    expect(merged.clinic.logoDataUrl).toBe('data:image/png;base64,AAAA')
    expect(merged.catalog.services.map((service) => service.id)).toEqual([
      'svc_local',
      'svc_remote',
    ])
    expect(merged.catalog.categories).toEqual(['Local', 'Remoto'])
    expect(merged.savedBudgetNotes).toEqual(['Nota remota'])
    expect(merged.quoteCounter).toBe(9)
  })

  it('si la empresa local es la de fábrica, usa la remota', () => {
    const local = profileFromState(profileSource())
    const remote = profileFromState(
      profileSource({ clinic: { ...cloneDefaultClinic(), name: 'Remota' } }),
    )
    expect(mergeProfiles(local, remote).clinic.name).toBe('Remota')
  })
})

describe('documentos remotos', () => {
  it('reconstruye un presupuesto y usa los metadatos de la fila', () => {
    const document = savedBudget('saved_1', '2026-10-01T10:00:00.000Z', 'Ana')
    const parsed = parseRemoteDocument(
      row(document, { saved_at: '2026-10-02T10:00:00.000Z' }),
    )
    expect(parsed?.kind).toBe('budget')
    expect(parsed?.savedAt).toBe('2026-10-02T10:00:00.000Z')
  })

  it('omite filas cifradas, con JSON inválido o con el tipo cambiado', () => {
    const document = savedBudget('saved_1', '2026-10-01T10:00:00.000Z', 'Ana')
    expect(parseRemoteDocument(row(document, { enc: true }))).toBeNull()
    expect(parseRemoteDocument(row(document, { payload: '{' }))).toBeNull()
    expect(parseRemoteDocument(row(document, { kind: 'quote' }))).toBeNull()
  })
})

describe('borradores remotos', () => {
  it('valida y devuelve solo el documento del modo pedido', () => {
    const budgetPayload = JSON.stringify(budgetDraftPayload({ budget: budget('Ana') }))
    expect(parseDraftPayload(budgetPayload, 'budget')).toMatchObject({
      patient: { name: 'Ana' },
    })
    expect(parseDraftPayload(budgetPayload, 'quote')).toBeNull()

    const quotePayload = JSON.stringify(quoteDraftPayload({ quote: quote('000000003', 'Luis') }))
    expect(parseDraftPayload(quotePayload, 'quote')).toMatchObject({
      number: '000000003',
    })
  })

  it('rechaza un payload inválido', () => {
    expect(parseDraftPayload('{', 'budget')).toBeNull()
    expect(parseDraftPayload(JSON.stringify({ version: 1 }), 'budget')).toBeNull()
  })
})

describe('mergeHistory', () => {
  it('une por id, aplica lápidas y ordena del más reciente al más antiguo', () => {
    const a = savedBudget('a', '2026-10-01T10:00:00.000Z', 'A')
    const b = savedBudget('b', '2026-10-03T10:00:00.000Z', 'B')
    const c = savedBudget('c', '2026-10-02T10:00:00.000Z', 'C')
    const result = mergeHistory([a, b], [b, c], new Set(['a']))
    expect(result.history.map((document) => document.id)).toEqual(['b', 'c'])
    expect(result.removedIds).toContain('a')
    expect(result.appliedRemoteIds).toEqual(['b', 'c'])
    expect(result.droppedByLimit).toBe(0)
  })

  it('respeta el tope y devuelve los descartados para borrarlos también en la nube', () => {
    const documents = [
      savedBudget('a', '2026-10-01T10:00:00.000Z', 'A'),
      savedBudget('b', '2026-10-02T10:00:00.000Z', 'B'),
      savedBudget('c', '2026-10-03T10:00:00.000Z', 'C'),
    ]
    const result = mergeHistory([], documents, new Set(), 2)
    expect(result.history.map((document) => document.id)).toEqual(['c', 'b'])
    expect(result.removedIds).toEqual(['a'])
    expect(result.droppedByLimit).toBe(1)
    expect(result.appliedRemoteIds).toEqual(['c', 'b'])
  })

  it('las lápidas mandan aunque el documento venga en la lista remota', () => {
    const a = savedBudget('a', '2026-10-01T10:00:00.000Z', 'A')
    const result = mergeHistory([a], [a], new Set(['a']))
    expect(result.history).toEqual([])
    expect(result.removedIds).toContain('a')
  })
})

describe('copias de conflicto', () => {
  it('crea un documento nuevo con una nota que explica el conflicto', () => {
    const original = budget('Ana')
    const copy = conflictDocument('budget', original, 'Teléfono')
    expect(copy.id).not.toBe('')
    expect(copy.kind).toBe('budget')
    if (copy.kind === 'budget') {
      expect(copy.budget.patient.name).toBe('Ana')
      expect(copy.budget.notes.at(-1)).toContain('Teléfono')
    }
  })

  it('hace lo mismo con una cotización, sin pasar el límite de condiciones', () => {
    const original = { ...quote('000000002', 'Luis'), terms: 'x'.repeat(999) }
    const copy = conflictDocument('quote', original, 'Computadora')
    if (copy.kind === 'quote') {
      expect(copy.quote.terms?.length).toBeLessThanOrEqual(1000)
      expect(copy.quote.terms).toContain('Copia en conflicto')
      expect(copy.quote.terms).toContain('Computadora')
    } else {
      throw new Error('Se esperaba una cotización')
    }
  })
})

describe('utilidades del historial', () => {
  it('detecta números de cotización repetidos', () => {
    const history = [
      savedQuote('a', '2026-10-01T10:00:00.000Z', '000000001', 'A'),
      savedQuote('b', '2026-10-02T10:00:00.000Z', '000000001', 'B'),
      savedQuote('c', '2026-10-03T10:00:00.000Z', '000000002', 'C'),
    ]
    expect(duplicateQuoteNumbers(history)).toEqual(['000000001'])
  })

  it('calcula el correlativo máximo', () => {
    const history = [
      savedQuote('a', '2026-10-01T10:00:00.000Z', '000000020', 'A'),
      savedQuote('b', '2026-10-02T10:00:00.000Z', 'COT-000004', 'B'),
    ]
    expect(maxQuoteCounter(history)).toBe(20)
  })
})
