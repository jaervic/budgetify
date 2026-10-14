import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { cloneDefaultCatalog, migrateCatalogDefaults } from '@/data/catalog'
import {
  cloneDefaultClinic,
  createEmptyBcvCache,
  createEmptyBudget,
  DEFAULT_PAGE_SIZE,
} from '@/data/defaults'
import { fetchBcvRate } from '@/lib/bcv'
import { newId } from '@/lib/ids'
import { bcvCacheSchema, budgetSchema, catalogSchema, clinicSchema } from '@/lib/io'
import type {
  BcvCache,
  Budget,
  Catalog,
  CatalogService,
  Clinic,
  Formula,
  Item,
  Pack,
  PackApplyMode,
  PageSize,
  RateMode,
} from '@/types'
import { createDebouncedStorage } from './storage'

export type NewService = Omit<CatalogService, 'id'>
export type NewPack = Omit<Pack, 'id'>

interface AppState {
  /** Presupuesto en edición (una sola instancia). */
  budget: Budget
  /** Biblioteca de tarifas de la clínica. */
  catalog: Catalog
  /** Datos de la clínica que encabezan el documento. */
  clinic: Clinic
  /** Si la tasa sigue al BCV (`auto`) o está fijada a mano (`manual`). */
  rateMode: RateMode
  /** Último valor conocido de la tasa BCV (cacheado para uso offline). */
  bcv: BcvCache
  /** Tamaño de hoja del documento (A4, Carta u Oficio). */
  pageSize: PageSize

  // ── Presupuesto ──────────────────────────────────────────────────────
  setPatient: (patch: Partial<Budget['patient']>) => void
  setProcedure: (procedure: string) => void
  setIssueDate: (issueDate: string) => void
  setRate: (rate: number) => void
  setNotes: (notes: string[]) => void
  addService: (service: CatalogService) => void
  addServicesFromPack: (pack: Pack, mode: PackApplyMode) => void
  addManualItem: (category: string) => void
  updateItem: (id: string, patch: Partial<Omit<Item, 'id'>>) => void
  updateFormula: (id: string, formula: Formula) => void
  removeItem: (id: string) => void
  duplicateItem: (id: string) => void
  moveItem: (id: string, direction: -1 | 1) => void
  loadBudget: (budget: Budget) => void
  clearBudget: () => void

  // ── Catálogo ─────────────────────────────────────────────────────────
  addCatalogService: (service: NewService) => void
  updateCatalogService: (id: string, patch: Partial<NewService>) => void
  removeCatalogService: (id: string) => void
  addCategory: (name: string) => void
  renameCategory: (from: string, to: string) => void
  removeCategory: (name: string) => void
  moveCategory: (name: string, direction: -1 | 1) => void
  addPack: (pack: NewPack) => void
  updatePack: (id: string, patch: Partial<NewPack>) => void
  removePack: (id: string) => void
  loadCatalog: (catalog: Catalog) => void
  resetCatalog: () => void
  /** Copia las tarifas del presupuesto al catálogo. Devuelve cuántos servicios cambió. */
  syncPricesToCatalog: () => number

  // ── Clínica y tasa BCV ───────────────────────────────────────────────
  setClinic: (patch: Partial<Clinic>) => void
  clearClinicLogo: () => void
  setRateMode: (mode: RateMode) => void
  /** Consulta la tasa oficial del BCV y, si el modo es `auto`, la aplica. */
  refreshBcvRate: () => Promise<void>
  setPageSize: (pageSize: PageSize) => void
}

/** Crea un ítem del presupuesto a partir de un servicio del catálogo. */
function itemFromService(service: CatalogService): Item {
  return {
    id: newId('item'),
    sourceServiceId: service.id,
    category: service.category,
    concept: service.concept,
    detail: service.detail,
    formula: structuredClone(service.formula),
  }
}

/** Crea el ítem de un pack aplicando, si procede, la cantidad indicada. */
function itemFromPack(service: CatalogService, qty?: number): Item {
  const item = itemFromService(service)
  if (qty !== undefined && item.formula.type === 'qty_unit') {
    item.formula = { ...item.formula, qty }
  }
  return item
}

export const useBudgetStore = create<AppState>()(
  persist(
    (set, get) => ({
      budget: createEmptyBudget(),
      catalog: cloneDefaultCatalog(),
      clinic: cloneDefaultClinic(),
      rateMode: 'auto',
      bcv: createEmptyBcvCache(),
      pageSize: DEFAULT_PAGE_SIZE,

      // ── Presupuesto ────────────────────────────────────────────────────
      setPatient: (patch) =>
        set((state) => ({
          budget: { ...state.budget, patient: { ...state.budget.patient, ...patch } },
        })),

      setProcedure: (procedure) =>
        set((state) => ({ budget: { ...state.budget, procedure } })),

      setIssueDate: (issueDate) =>
        set((state) => ({ budget: { ...state.budget, issueDate } })),

      // Editar la tasa a mano desancla el cálculo del BCV.
      setRate: (rate) =>
        set((state) => ({ rateMode: 'manual', budget: { ...state.budget, rate } })),

      setNotes: (notes) => set((state) => ({ budget: { ...state.budget, notes } })),

      addService: (service) =>
        set((state) => ({
          budget: { ...state.budget, items: [...state.budget.items, itemFromService(service)] },
        })),

      addServicesFromPack: (pack, mode) =>
        set((state) => {
          const { services } = state.catalog
          const created = pack.services
            .map((entry) => {
              const service = services.find((s) => s.id === entry.serviceId)
              return service ? itemFromPack(service, entry.qty) : null
            })
            .filter((item): item is Item => item !== null)
          const items =
            mode === 'replace' ? created : [...state.budget.items, ...created]
          return { budget: { ...state.budget, items } }
        }),

      addManualItem: (category) =>
        set((state) => ({
          budget: {
            ...state.budget,
            items: [
              ...state.budget.items,
              {
                id: newId('item'),
                category,
                concept: 'Nuevo servicio',
                formula: { type: 'fixed', amountUsd: 0 },
              },
            ],
          },
        })),

      updateItem: (id, patch) =>
        set((state) => ({
          budget: {
            ...state.budget,
            items: state.budget.items.map((item) =>
              item.id === id ? { ...item, ...patch, id: item.id } : item,
            ),
          },
        })),

      updateFormula: (id, formula) =>
        set((state) => ({
          budget: {
            ...state.budget,
            items: state.budget.items.map((item) =>
              item.id === id ? { ...item, formula } : item,
            ),
          },
        })),

      removeItem: (id) =>
        set((state) => ({
          budget: {
            ...state.budget,
            items: state.budget.items.filter((item) => item.id !== id),
          },
        })),

      duplicateItem: (id) =>
        set((state) => {
          const index = state.budget.items.findIndex((item) => item.id === id)
          if (index === -1) return state
          const clone: Item = { ...state.budget.items[index], id: newId('item') }
          const items = [...state.budget.items]
          items.splice(index + 1, 0, clone)
          return { budget: { ...state.budget, items } }
        }),

      moveItem: (id, direction) =>
        set((state) => {
          const items = [...state.budget.items]
          const index = items.findIndex((item) => item.id === id)
          if (index === -1) return state
          const category = items[index].category
          // Solo se reordena dentro de la misma categoría para no romper el agrupado.
          let target = -1
          for (let j = index + direction; j >= 0 && j < items.length; j += direction) {
            if (items[j].category === category) {
              target = j
              break
            }
          }
          if (target === -1) return state
          ;[items[index], items[target]] = [items[target], items[index]]
          return { budget: { ...state.budget, items } }
        }),

      loadBudget: (budget) => set({ budget }),

      clearBudget: () => set({ budget: createEmptyBudget() }),

      // ── Catálogo ───────────────────────────────────────────────────────
      addCatalogService: (service) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            services: [...state.catalog.services, { ...service, id: newId('svc') }],
            categories: state.catalog.categories.includes(service.category)
              ? state.catalog.categories
              : [...state.catalog.categories, service.category],
          },
        })),

      updateCatalogService: (id, patch) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            services: state.catalog.services.map((service) =>
              service.id === id ? { ...service, ...patch, id: service.id } : service,
            ),
            categories:
              patch.category && !state.catalog.categories.includes(patch.category)
                ? [...state.catalog.categories, patch.category]
                : state.catalog.categories,
          },
        })),

      removeCatalogService: (id) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            services: state.catalog.services.filter((service) => service.id !== id),
            packs: state.catalog.packs.map((pack) => ({
              ...pack,
              services: pack.services.filter((entry) => entry.serviceId !== id),
            })),
          },
        })),

      addCategory: (name) =>
        set((state) => {
          const clean = name.trim()
          if (!clean || state.catalog.categories.includes(clean)) return state
          return {
            catalog: { ...state.catalog, categories: [...state.catalog.categories, clean] },
          }
        }),

      renameCategory: (from, to) =>
        set((state) => {
          const clean = to.trim()
          if (!clean || from === clean || state.catalog.categories.includes(clean)) {
            return state
          }
          const rename = <T extends { category: string }>(entity: T): T =>
            entity.category === from ? { ...entity, category: clean } : entity
          return {
            catalog: {
              ...state.catalog,
              categories: state.catalog.categories.map((c) => (c === from ? clean : c)),
              services: state.catalog.services.map(rename),
            },
            budget: { ...state.budget, items: state.budget.items.map(rename) },
          }
        }),

      removeCategory: (name) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            categories: state.catalog.categories.filter((c) => c !== name),
            services: state.catalog.services.filter((service) => service.category !== name),
          },
        })),

      moveCategory: (name, direction) =>
        set((state) => {
          const categories = [...state.catalog.categories]
          const index = categories.indexOf(name)
          const target = index + direction
          if (index === -1 || target < 0 || target >= categories.length) return state
          ;[categories[index], categories[target]] = [categories[target], categories[index]]
          return { catalog: { ...state.catalog, categories } }
        }),

      addPack: (pack) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            packs: [...state.catalog.packs, { ...pack, id: newId('pack') }],
          },
        })),

      updatePack: (id, patch) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            packs: state.catalog.packs.map((pack) =>
              pack.id === id ? { ...pack, ...patch, id: pack.id } : pack,
            ),
          },
        })),

      removePack: (id) =>
        set((state) => ({
          catalog: {
            ...state.catalog,
            packs: state.catalog.packs.filter((pack) => pack.id !== id),
          },
        })),

      loadCatalog: (catalog) => set({ catalog }),

      resetCatalog: () => set({ catalog: cloneDefaultCatalog() }),

      syncPricesToCatalog: () => {
        const { budget, catalog } = get()
        let updated = 0
        const services = catalog.services.map((service) => {
          const items = budget.items.filter((item) => item.sourceServiceId === service.id)
          if (items.length === 0) return service
          const latest = items[items.length - 1]
          updated += 1
          return {
            ...service,
            category: latest.category,
            concept: latest.concept,
            detail: latest.detail,
            formula: structuredClone(latest.formula),
          }
        })
        if (updated > 0) set({ catalog: { ...catalog, services } })
        return updated
      },

      // ── Clínica y tasa BCV ─────────────────────────────────────────────
      setClinic: (patch) =>
        set((state) => ({ clinic: { ...state.clinic, ...patch } })),

      clearClinicLogo: () =>
        set((state) => ({ clinic: { ...state.clinic, logoDataUrl: undefined } })),

      setRateMode: (mode) => {
        if (mode === 'manual') {
          set({ rateMode: 'manual' })
          return
        }
        // Al anclar: aplica ya el último valor conocido y refresca si no hay.
        const { bcv } = get()
        set((state) => ({
          rateMode: 'auto',
          budget:
            bcv.value !== null ? { ...state.budget, rate: bcv.value } : state.budget,
        }))
        if (bcv.value === null) void get().refreshBcvRate()
      },

      refreshBcvRate: async () => {
        // Evita consultas duplicadas (p. ej. por StrictMode).
        if (get().bcv.status === 'loading') return

        set((state) => ({ bcv: { ...state.bcv, status: 'loading', error: null } }))
        try {
          const rate = await fetchBcvRate()
          set((state) => ({
            bcv: {
              value: rate.value,
              updatedAt: rate.updatedAt,
              fetchedAt: new Date().toISOString(),
              status: 'ok',
              error: null,
            },
            budget:
              state.rateMode === 'auto'
                ? { ...state.budget, rate: rate.value }
                : state.budget,
          }))
        } catch (error) {
          set((state) => ({
            bcv: {
              ...state.bcv,
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'No se pudo obtener la tasa BCV.',
            },
          }))
        }
      },

      setPageSize: (pageSize) => set({ pageSize }),
    }),
    {
      name: 'budgetify:v1',
      version: 5,
      storage: createJSONStorage(() => createDebouncedStorage(500)),
      partialize: (state) => ({
        budget: state.budget,
        catalog: state.catalog,
        clinic: state.clinic,
        rateMode: state.rateMode,
        bcv: state.bcv,
        pageSize: state.pageSize,
      }),
      // Migra y valida lo guardado: si el borrador no encaja con el modelo
      // actual (versión antigua o datos corruptos) se usan los valores por
      // defecto en lugar de romper la app al arrancar.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Record<string, unknown>
        const budget = budgetSchema.safeParse(state.budget)
        const catalog = catalogSchema.safeParse(state.catalog)
        const clinic = clinicSchema.safeParse(state.clinic)
        const bcv = bcvCacheSchema.safeParse(state.bcv)
        return {
          budget: budget.success ? budget.data : createEmptyBudget(),
          // Añade los servicios nuevos que falten, mueve los reorganizados y no
          // pisa los precios que el usuario haya editado.
          catalog: migrateCatalogDefaults(
            catalog.success ? catalog.data : cloneDefaultCatalog(),
          ),
          clinic: clinic.success ? clinic.data : cloneDefaultClinic(),
          rateMode: state.rateMode === 'manual' ? ('manual' as const) : ('auto' as const),
          pageSize:
            state.pageSize === 'Letter' || state.pageSize === 'Legal'
              ? state.pageSize
              : DEFAULT_PAGE_SIZE,
          // Nunca restauramos el estado "loading": quedaría colgado.
          bcv:
            bcv.success && bcv.data.status !== 'loading'
              ? bcv.data
              : createEmptyBcvCache(),
        }
      },
    },
  ),
)
