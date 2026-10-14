import { Plus, Trash2 } from 'lucide-react'
import { FormulaFields } from '@/components/FormulaFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Alta, edición y borrado de servicios de la biblioteca. */
export function ServicesPanel() {
  const catalog = useBudgetStore((state) => state.catalog)
  const addCatalogService = useBudgetStore((state) => state.addCatalogService)
  const updateCatalogService = useBudgetStore((state) => state.updateCatalogService)
  const removeCatalogService = useBudgetStore((state) => state.removeCatalogService)

  const concepts = [...new Set(catalog.services.map((service) => service.concept))]
  const categories = catalog.categories

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() =>
            addCatalogService({
              category: categories[0] ?? 'General',
              concept: 'Nuevo servicio',
              formula: { type: 'fixed', amountUsd: 0 },
            })
          }
        >
          <Plus />
          Nuevo servicio
        </Button>
        <datalist id="category-options">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>

      <ScrollArea className="h-[46vh] pr-3">
        <div className="grid gap-2">
          {catalog.services.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              El catálogo está vacío.
            </p>
          )}
          {catalog.services.map((service) => (
            <div key={service.id} className="grid gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Input
                  className="font-medium"
                  aria-label="Concepto"
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
                  onClick={() => removeCatalogService(service.id)}
                >
                  <Trash2 />
                </Button>
              </div>

              <Input
                className="text-xs"
                aria-label="Detalle"
                placeholder="Detalle (opcional)"
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
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
