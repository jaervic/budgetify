import { cloneDefaultCatalog, migrateCatalogDefaults } from '@/data/catalog'
import {
  cloneDefaultClinic,
  createEmptyBcvCache,
  createEmptyBudget,
  DEFAULT_PAGE_SIZE,
} from '@/data/defaults'
import { bcvCacheSchema, budgetSchema, catalogSchema, clinicSchema } from '@/lib/io'
import type { BcvCache, Budget, Catalog, Clinic, PageSize, RateMode } from '@/types'

/** Parte del estado que se guarda en el navegador. */
export interface PersistedState {
  budget: Budget
  catalog: Catalog
  clinic: Clinic
  rateMode: RateMode
  bcv: BcvCache
  pageSize: PageSize
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
  const clinic = clinicSchema.safeParse(state.clinic)
  const bcv = bcvCacheSchema.safeParse(state.bcv)

  return {
    budget: budget.success ? budget.data : createEmptyBudget(),
    catalog: migrateCatalogDefaults(
      catalog.success ? catalog.data : cloneDefaultCatalog(),
    ),
    clinic: clinic.success ? clinic.data : cloneDefaultClinic(),
    rateMode: state.rateMode === 'manual' ? 'manual' : 'auto',
    pageSize:
      state.pageSize === 'Letter' || state.pageSize === 'Legal'
        ? state.pageSize
        : DEFAULT_PAGE_SIZE,
    // Nunca se restaura el estado "loading": quedaría colgado.
    bcv:
      bcv.success && bcv.data.status !== 'loading' ? bcv.data : createEmptyBcvCache(),
  }
}
