import { cloneDefaultCatalog, migrateCatalogDefaults } from '@/data/catalog'
import {
  cloneDefaultClinic,
  createEmptyBcvCache,
  createEmptyBudget,
  createEmptyQuote,
  DEFAULT_PAGE_SIZE,
  DEFAULT_QUOTE_PAGE_SIZE,
  formatQuoteNumber,
  quoteNumberValue,
} from '@/data/defaults'
import {
  bcvCacheSchema,
  budgetSchema,
  catalogSchema,
  clinicSchema,
  historySchema,
  quoteSchema,
} from '@/lib/io'
import type {
  BcvCache,
  Budget,
  Catalog,
  Clinic,
  DocMode,
  PageSize,
  Quote,
  RateMode,
  SavedDocument,
} from '@/types'

/** Parte del estado que se guarda en el navegador. */
export interface PersistedState {
  budget: Budget
  catalog: Catalog
  clinic: Clinic
  rateMode: RateMode
  bcv: BcvCache
  pageSize: PageSize
  docMode: DocMode
  quote: Quote
  quotePageSize: PageSize
  quoteCounter: number
  history: SavedDocument[]
}

/**
 * Ajusta y valida lo guardado en el navegador antes de usarlo.
 *
 * Si una parte no encaja con el modelo actual (versión antigua o datos
 * corruptos) se usa el valor por defecto de esa parte en lugar de romper la app
 * al arrancar. El catálogo siempre pasa por `migrateCatalogDefaults`, que añade
 * las áreas, categorías, servicios y plantillas nuevas sin pisar lo editado.
 */
export function migratePersisted(persisted: unknown): PersistedState {
  const state = (persisted ?? {}) as Record<string, unknown>
  const budget = budgetSchema.safeParse(state.budget)
  const catalog = catalogSchema.safeParse(state.catalog)
  // Un catálogo guardado con la lista de productos (aunque esté vacía) ya pasó
  // por la migración de cotizaciones: no hay que volver a sembrar los ejemplos.
  const rawCatalog = state.catalog
  const hadProducts =
    Boolean(rawCatalog) &&
    typeof rawCatalog === 'object' &&
    Array.isArray((rawCatalog as Record<string, unknown>).products)
  const clinic = clinicSchema.safeParse(state.clinic)
  const bcv = bcvCacheSchema.safeParse(state.bcv)
  const history = historySchema.safeParse(state.history)
  const quote = quoteSchema.safeParse(state.quote)

  const storedCounter =
    typeof state.quoteCounter === 'number' &&
    Number.isFinite(state.quoteCounter) &&
    state.quoteCounter >= 1
      ? Math.trunc(state.quoteCounter)
      : 1
  const restoredQuote = quote.success
    ? quote.data
    : createEmptyQuote(formatQuoteNumber(storedCounter))
  const counter = Math.max(storedCounter, quoteNumberValue(restoredQuote.number))

  const readPageSize = (value: unknown, fallback: PageSize): PageSize =>
    value === 'Letter' || value === 'Legal' || value === 'A4' ? value : fallback

  return {
    budget: budget.success ? budget.data : createEmptyBudget(),
    catalog: migrateCatalogDefaults(
      catalog.success ? catalog.data : cloneDefaultCatalog(),
      { seedProducts: !hadProducts },
    ),
    clinic: clinic.success ? clinic.data : cloneDefaultClinic(),
    rateMode: state.rateMode === 'manual' ? 'manual' : 'auto',
    pageSize: readPageSize(state.pageSize, DEFAULT_PAGE_SIZE),
    docMode: state.docMode === 'quote' ? 'quote' : 'budget',
    quote: restoredQuote,
    quotePageSize: readPageSize(state.quotePageSize, DEFAULT_QUOTE_PAGE_SIZE),
    quoteCounter: counter,
    // Nunca se restaura el estado "loading": quedaría colgado.
    bcv:
      bcv.success && bcv.data.status !== 'loading' ? bcv.data : createEmptyBcvCache(),
    // El historial nació después: los borradores guardados antes no lo traen.
    history: history.success ? history.data : [],
  }
}
