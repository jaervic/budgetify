import { Layers, Plus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { Pack, PackApplyMode } from '@/types'

interface PackPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Carga plantillas de servicios (packs) para tipos de caso frecuentes. */
export function PackPickerDialog({ open, onOpenChange }: PackPickerDialogProps) {
  const packs = useBudgetStore((state) => state.catalog.packs)
  const hasItems = useBudgetStore((state) => state.budget.items.length > 0)
  const applyPack = useBudgetStore((state) => state.addServicesFromPack)

  const handleApply = (pack: Pack, mode: PackApplyMode) => {
    applyPack(pack, mode)
    toast.success(
      `${pack.name}: ${pack.services.length} servicio(s) ${
        mode === 'replace' ? 'cargados' : 'añadidos'
      }`,
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Plantillas de caso (packs)</DialogTitle>
          <DialogDescription>
            Carga un conjunto de servicios ya armado y luego ajusta precios o cantidades.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[52vh] pr-3">
          <div className="grid gap-2">
            {packs.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay plantillas. Créalas en “Gestionar catálogo”.
              </p>
            )}

            {packs.map((pack) => (
              <div
                key={pack.id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">{pack.name}</span>
                    <Badge variant="secondary">{pack.services.length}</Badge>
                  </div>
                  {pack.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{pack.description}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(pack, 'append')}
                  >
                    <Plus />
                    Añadir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!hasItems}
                    title={hasItems ? undefined : 'El presupuesto está vacío'}
                    onClick={() => handleApply(pack, 'replace')}
                  >
                    <RotateCcw />
                    Reemplazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
