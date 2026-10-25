import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CategorySelect } from '@/components/CategorySelect'
import { FormulaFields } from '@/components/FormulaFields'
import { SpecialtySelect } from '@/components/SpecialtySelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { isServiceInArea } from '@/lib/catalog'
import { LIMITS } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Alta, edición y borrado de servicios de la biblioteca. */
export function ServicesPanel() {
  const catalog = useBudgetStore((state) => state.catalog)
  const addCatalogService = useBudgetStore((state) => state.addCatalogService)
  const updateCatalogService = useBudgetStore((state) => state.updateCatalogService)
  const removeCatalogService = useBudgetStore((state) => state.removeCatalogService)
  const [areaFilter, setAreaFilter] = useState<string | undefined>(undefined)

  const concepts = [...new Set(catalog.services.map((service) => service.concept))]
  const categories = catalog.categories
  // Todas las categorías conocidas: las del catálogo más las que ya usan los
  // servicios (por si alguna se quitó de la lista).
  const categoryOptions = [
    ...new Set([...categories, ...catalog.services.map((service) => service.category)]),
  ]

  const visible = catalog.services.filter((service) =>
    isServiceInArea(service, areaFilter),
  )

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Button
          type="button"
          size="sm"
          className="h-11 w-full sm:h-9 sm:w-auto"
          onClick={() =>
            addCatalogService({
              category: categories[0] ?? 'General',
              concept: 'Nuevo servicio',
              formula: { type: 'fixed', amountUsd: 0 },
              specialtyId: areaFilter,
            })
          }
        >
          <Plus />
          Nuevo servicio
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-64">
            <SpecialtySelect
              specialties={catalog.specialties}
              value={areaFilter}
              onChange={setAreaFilter}
              noneLabel="Todas las áreas"
              className="h-11 text-sm sm:h-10"
              ariaLabel="Filtrar servicios por área"
            />
          </div>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length} de {catalog.services.length} servicios
          </span>
        </div>
      </div>

      <ScrollArea className="h-[42vh] pr-3">
        <div className="grid gap-2">
          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay servicios en esta área.
            </p>
          )}
          {visible.map((service) => (
            <div
              key={service.id}
              className="grid gap-2 rounded-lg border p-3 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <Input
                  className="font-medium"
                  aria-label="Concepto"
                  maxLength={LIMITS.concept}
                  value={service.concept}
                  onChange={(event) =>
                    updateCatalogService(service.id, { concept: event.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar servicio"
                  className="size-10 text-destructive hover:text-destructive sm:size-9"
                  onClick={() =>
                    withUndo(
                      { catalog: useBudgetStore.getState().catalog },
                      'Servicio eliminado del catálogo',
                      () => removeCatalogService(service.id),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>

              <Input
                aria-label="Detalle"
                placeholder="Detalle (opcional)"
                maxLength={LIMITS.detail}
                value={service.detail ?? ''}
                onChange={(event) =>
                  updateCatalogService(service.id, {
                    detail: event.target.value || undefined,
                  })
                }
              />

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <CategorySelect
                  value={service.category}
                  options={categoryOptions}
                  onChange={(category) => updateCatalogService(service.id, { category })}
                  ariaLabel="Categoría"
                  className="h-10 w-full text-sm"
                />
                <FormulaFields
                  formula={service.formula}
                  onChange={(formula) => updateCatalogService(service.id, { formula })}
                  concepts={concepts}
                  categories={categories}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center">
                <SpecialtySelect
                  specialties={catalog.specialties}
                  value={service.specialtyId}
                  onChange={(specialtyId) =>
                    updateCatalogService(service.id, { specialtyId })
                  }
                  noneLabel="Transversal (todas)"
                  className="h-10 text-sm"
                  ariaLabel="Área del servicio"
                />
                <p className="text-sm text-muted-foreground">
                  Transversal: se ofrece en todas las áreas.
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
