import { describe, expect, it } from 'vitest'
import { cloneDefaultCatalog } from '@/data/catalog'
import {
  cloneDefaultClinic,
  createEmptyBudget,
  createEmptyQuote,
  DEFAULT_QUOTE_TERMS,
} from '@/data/defaults'
import type { SavedDocument } from '@/types'
import {
  hasMeaningfulBudget,
  hasMeaningfulDraft,
  hasMeaningfulLocalData,
  hasMeaningfulProfile,
  hasMeaningfulQuote,
} from './localData'
import type { SyncLocalSnapshot } from './types'

function snapshot(): SyncLocalSnapshot {
  return {
    clinic: cloneDefaultClinic(),
    catalog: cloneDefaultCatalog(),
    savedBudgetNotes: null,
    savedQuoteTerms: null,
    pageSize: 'A4',
    quotePageSize: 'Letter',
    rateMode: 'auto',
    quoteCounter: 1,
    budget: createEmptyBudget(),
    quote: createEmptyQuote(),
    history: [],
  }
}

describe('datos locales que merecen sincronizarse', () => {
  it('reconoce un estado recién instalado como vacío', () => {
    const state = snapshot()
    expect(hasMeaningfulProfile(state)).toBe(false)
    expect(hasMeaningfulDraft(state)).toBe(false)
    expect(hasMeaningfulLocalData(state)).toBe(false)
  })

  it('no se confunde por el orden de las claves del catálogo', () => {
    const catalog = cloneDefaultCatalog()
    const reordered = {
      packs: catalog.packs,
      products: catalog.products,
      categories: catalog.categories,
      services: catalog.services,
      productCatalogVersion: catalog.productCatalogVersion,
      specialties: catalog.specialties,
    }
    expect(hasMeaningfulProfile({ ...snapshot(), catalog: reordered })).toBe(false)
  })

  it('detecta datos de empresa, catálogo y preferencias', () => {
    expect(
      hasMeaningfulProfile({ ...snapshot(), clinic: { ...cloneDefaultClinic(), name: 'Mi clínica' } }),
    ).toBe(true)
    expect(
      hasMeaningfulProfile({
        ...snapshot(),
        catalog: { ...cloneDefaultCatalog(), categories: ['Otra'] },
      }),
    ).toBe(true)
    expect(hasMeaningfulProfile({ ...snapshot(), rateMode: 'manual' })).toBe(true)
    expect(hasMeaningfulProfile({ ...snapshot(), quoteCounter: 2 })).toBe(true)
  })

  it('distingue borrador de presupuesto y de cotización', () => {
    const budget = { ...createEmptyBudget(), patient: { name: 'Ana' } }
    const quote = {
      ...createEmptyQuote('000000005'),
      client: { name: 'Luis' },
    }
    expect(hasMeaningfulBudget(budget)).toBe(true)
    expect(hasMeaningfulQuote(quote)).toBe(true)
    expect(hasMeaningfulDraft({ budget, quote: createEmptyQuote() })).toBe(true)
    expect(hasMeaningfulDraft({ budget: createEmptyBudget(), quote })).toBe(true)
  })

  it('no confunde las condiciones por defecto con una cotización editada', () => {
    const quote = { ...createEmptyQuote(), terms: DEFAULT_QUOTE_TERMS }
    expect(hasMeaningfulQuote(quote)).toBe(false)
    expect(hasMeaningfulQuote({ ...quote, terms: `${DEFAULT_QUOTE_TERMS}\nOtra` })).toBe(
      true,
    )
  })

  it('considera el historial como dato local', () => {
    const document: SavedDocument = {
      id: 'saved_1',
      savedAt: '2026-10-01T10:00:00.000Z',
      kind: 'budget',
      budget: createEmptyBudget(),
    }
    expect(hasMeaningfulLocalData({ ...snapshot(), history: [document] })).toBe(true)
  })
})
