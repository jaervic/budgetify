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
import { describeFormula } from '@/lib/describe'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'
import type { CatalogService } from '@/types'

interface CatalogPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Selector de servicios del catálogo para agregarlos al presupuesto. */
export function CatalogPickerDialog({ open, onOpenChange }: CatalogPickerDialogProps) {
  const catalog = useBudgetStore((state) => state.catalog)
  const addService = useBudgetStore((state) => state.addService)
  const [query, setQuery] = useState('')

  const handleAdd = (service: CatalogService) => {
    addService(service)
    toast.success(`${service.concept} agregado al presupuesto`)
  }

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = catalog.services.filter((service) => {
      if (!term) return true
      return (
        service.concept.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term) ||
        (service.detail?.toLowerCase().includes(term) ?? false)
      )
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
    return [...map.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    )
  }, [catalog, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar servicios</DialogTitle>
          <DialogDescription>
            Elige los servicios del catálogo. Puedes cambiar precios y cantidades en la tabla.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar servicio, categoría o detalle…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <ScrollArea className="h-[52vh] pr-3">
          <div className="grid gap-4">
            {groups.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin resultados para “{query}”.
              </p>
            )}
            {groups.map(([category, services]) => (
              <section key={category} className="grid gap-1.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
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
                        <span className="block text-xs break-words text-muted-foreground">
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
          <Button type="button" onClick={() => onOpenChange(false)}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
