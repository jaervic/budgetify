import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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

  const visible = catalog.services.filter((service) =>
    isServiceInArea(service, areaFilter),
  )

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
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
        <div className="w-full sm:w-64">
          <SpecialtySelect
            specialties={catalog.specialties}
            value={areaFilter}
            onChange={setAreaFilter}
            noneLabel="Todas las áreas"
            className="h-8 text-xs"
            ariaLabel="Filtrar servicios por área"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {visible.length} de {catalog.services.length} servicios
        </span>
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <ScrollArea className="h-[42vh] pr-3">
        <div className="grid gap-2">
          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay servicios en esta área.
            </p>
          )}
          {visible.map((service) => (
            <div key={service.id} className="grid gap-2 rounded-lg border p-3">
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
                  className="text-destructive hover:text-destructive"
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
                className="text-xs"
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
                <Input
                  list="category-options"
                  aria-label="Categoría"
                  maxLength={LIMITS.category}
                  value={service.category}
                  onChange={(event) =>
                    updateCatalogService(service.id, { category: event.target.value })
                  }
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
                  className="h-8 text-xs"
                  ariaLabel="Área del servicio"
                />
                <p className="text-xs text-muted-foreground">
                  Un servicio transversal se ofrece en todas las áreas.
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
