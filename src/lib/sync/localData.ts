import { cloneDefaultCatalog } from '@/data/catalog'
import {
  DEFAULT_CLINIC,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUOTE_PAGE_SIZE,
  DEFAULT_QUOTE_TERMS,
  quoteNumberValue,
} from '@/data/defaults'
import type { Budget, Clinic, Quote } from '@/types'
import type { SyncDraftSource, SyncLocalSnapshot, SyncProfileSource } from './types'

/**
 * Compara objetos sin depender del orden de las claves. El catálogo puede venir
 * de Supabase con las claves en otro orden y no por eso deja de ser el de
 * fábrica.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

const DEFAULT_CLINIC_FINGERPRINT = stableStringify(DEFAULT_CLINIC)
const DEFAULT_CATALOG_FINGERPRINT = stableStringify(cloneDefaultCatalog())

/** La empresa sigue siendo la de fábrica (sin depender del orden de claves). */
export function isDefaultClinic(clinic: Clinic): boolean {
  return stableStringify(clinic) === DEFAULT_CLINIC_FINGERPRINT
}

/**
 * ¿Hay algo que merezca la pena conservar al iniciar sesión?
 *
 * No se compara el objeto entero del presupuesto porque la fecha, la tasa y las
 * notas por defecto cambian solas. Solo cuentan los datos que escribió la
 * persona.
 */
export function hasMeaningfulProfile(state: SyncProfileSource): boolean {
  if (!isDefaultClinic(state.clinic)) return true
  if (stableStringify(state.catalog) !== DEFAULT_CATALOG_FINGERPRINT) return true
  if (state.savedBudgetNotes !== null) return true
  if (state.savedQuoteTerms !== null) return true
  if (state.pageSize !== DEFAULT_PAGE_SIZE) return true
  if (state.quotePageSize !== DEFAULT_QUOTE_PAGE_SIZE) return true
  if (state.rateMode !== 'auto') return true
  if (state.quoteCounter > 1) return true
  return false
}

export function hasMeaningfulBudget(budget: Budget): boolean {
  return Boolean(
    budget.patient.name.trim() ||
      budget.patient.ci?.trim() ||
      budget.patient.age !== undefined ||
      budget.procedure?.trim() ||
      budget.items.length > 0,
  )
}

export function hasMeaningfulQuote(quote: Quote): boolean {
  return Boolean(
    quote.client.name.trim() ||
      quote.client.code?.trim() ||
      quote.client.rif?.trim() ||
      quote.client.phones?.trim() ||
      quote.client.address?.trim() ||
      quote.seller?.trim() ||
      quote.office?.trim() ||
      quote.transport?.trim() ||
      quote.purchaseOrder?.trim() ||
      quote.description?.trim() ||
      quote.dueDate?.trim() ||
      quote.currency !== 'USD' ||
      quote.showBothCurrencies ||
      (quote.terms?.trim() && quote.terms !== DEFAULT_QUOTE_TERMS) ||
      quote.items.length > 0 ||
      quoteNumberValue(quote.number) > 1,
  )
}

export function hasMeaningfulDraft(state: SyncDraftSource): boolean {
  return hasMeaningfulBudget(state.budget) || hasMeaningfulQuote(state.quote)
}

export function hasMeaningfulLocalData(state: SyncLocalSnapshot): boolean {
  return (
    state.history.length > 0 ||
    hasMeaningfulProfile(state) ||
    hasMeaningfulDraft(state)
  )
}
