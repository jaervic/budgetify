import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { filterServices } from '@/lib/catalog'
import { describeFormula } from '@/lib/describe'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'
import type { CatalogService } from '@/types'

interface CatalogPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Centinela del chip "todo el catálogo". */
const ALL = 'all'

const chipClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-full border px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
  )

/** Contenido del selector. Se desmonta al cerrar el diálogo, así que el filtro
 * vuelve a partir del área configurada en "Datos de la clínica". */
function PickerContent({ onClose }: { onClose: () => void }) {
  const catalog = useBudgetStore((state) => state.catalog)
  const clinicSpecialtyId = useBudgetStore((state) => state.clinic.specialtyId)
  const addService = useBudgetStore((state) => state.addService)
  const [query, setQuery] = useState('')
  const [activeArea, setActiveArea] = useState<string>(clinicSpecialtyId ?? ALL)

  const handleAdd = (service: CatalogService) => {
    addService(service)
    toast.success(`${service.concept} agregado al presupuesto`)
  }

  const groups = useMemo(() => {
    const filtered = filterServices(catalog.services, {
      query,
      specialtyId: activeArea === ALL ? undefined : activeArea,
    })

    const order = [
      ...catalog.categories,
      ...filtered.map((s) => s.category).filter((c) => !catalog.categories.includes(c)),
    ]
    const map = new Map<string, CatalogService[]>()
    for (const service of filtered) {
      const list = map.get(service.category)
      if (list) list.push(service)
      else map.set(service.category, [service])
    }
    // Con un área activa, sus categorías van primero y las transversales
    // (enfermería, estudios, gastos) después, que es el orden en que se usan.
    const areaCategories = new Set(
      filtered.filter((s) => s.specialtyId === activeArea).map((s) => s.category),
    )
    return [...map.entries()].sort((a, b) => {
      if (activeArea !== ALL) {
        const diff = (areaCategories.has(a[0]) ? 0 : 1) - (areaCategories.has(b[0]) ? 0 : 1)
        if (diff !== 0) return diff
      }
      return order.indexOf(a[0]) - order.indexOf(b[0])
    })
  }, [catalog, query, activeArea])

  const activeAreaName = catalog.specialties.find((s) => s.id === activeArea)?.name

  return (
    <>
      <div className="grid gap-2">
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          role="group"
          aria-label="Filtrar por área de práctica"
        >
          <button
            type="button"
            className={chipClass(activeArea === ALL)}
            aria-pressed={activeArea === ALL}
            onClick={() => setActiveArea(ALL)}
          >
            Todo el catálogo
          </button>
          {catalog.specialties.map((specialty) => (
            <button
              key={specialty.id}
              type="button"
              className={chipClass(activeArea === specialty.id)}
              aria-pressed={activeArea === specialty.id}
              onClick={() => setActiveArea(specialty.id)}
            >
              {specialty.name}
            </button>
          ))}
        </div>
        {activeAreaName && (
          <p className="text-sm text-muted-foreground">
            Se muestran los servicios de <b>{activeAreaName}</b> y los generales (enfermería,
            estudios, gastos de clínica). Elige «Todo el catálogo» para verlos todos.
          </p>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Buscar servicio, categoría o detalle…"
          aria-label="Buscar servicios"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <ScrollArea className="h-[52vh] pr-3">
        <div className="grid gap-4">
          {groups.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query
                ? `Sin resultados para “${query}”.`
                : 'No hay servicios en esta área. Prueba con «Todo el catálogo».'}
            </p>
          )}
          {groups.map(([category, services]) => (
            <section key={category} className="grid gap-1.5">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {category} <span className="font-normal">({services.length})</span>
              </h3>
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleAdd(service)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3',
                    'hover:border-primary/40 hover:bg-accent',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium break-words">
                      {service.concept}
                    </span>
                    {service.detail && (
                      <span className="block text-sm break-words text-muted-foreground">
                        {service.detail}
                      </span>
                    )}
                  </span>
                  <span className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-end">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {describeFormula(service.formula)}
                    </span>
                    <Plus className="size-4 shrink-0 text-primary" />
                  </span>
                </button>
              ))}
            </section>
          ))}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button type="button" onClick={onClose}>
          Listo
        </Button>
      </DialogFooter>
    </>
  )
}

/** Selector de servicios del catálogo para agregarlos al presupuesto. */
export function CatalogPickerDialog({ open, onOpenChange }: CatalogPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar servicios</DialogTitle>
          <DialogDescription>
            Elige los servicios del catálogo. Puedes cambiar precios y cantidades en la tabla.
          </DialogDescription>
        </DialogHeader>
        <PickerContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
