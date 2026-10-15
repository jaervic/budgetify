import { useMemo } from 'react'
import { FolderOpen, History, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { computeBudget } from '@/lib/calc'
import { formatTimestamp } from '@/lib/date'
import { formatUsd } from '@/lib/money'
import { HISTORY_LIMIT } from '@/lib/limits'
import { keepOpenForToast, withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Se llama al cargar una copia, para remontar el formulario de datos. */
  onBudgetReplaced: () => void
}

/**
 * Historial de presupuestos guardados en este navegador.
 *
 * Cada entrada se guarda entera (no una referencia al catálogo), así que abrir
 * una copia antigua restaura exactamente lo que se veía entonces. El nombre del
 * paciente, el número de líneas y el total no se almacenan: se calculan aquí,
 * de modo que no hay datos duplicados que puedan quedar desfasados.
 */
export function HistoryDialog({ open, onOpenChange, onBudgetReplaced }: HistoryDialogProps) {
  const history = useBudgetStore((state) => state.history)
  const loadSavedBudget = useBudgetStore((state) => state.loadSavedBudget)
  const removeSavedBudget = useBudgetStore((state) => state.removeSavedBudget)

  const entries = useMemo(
    () =>
      history.map((entry) => ({
        id: entry.id,
        savedAt: entry.savedAt,
        patient: entry.budget.patient.name.trim(),
        procedure: entry.budget.procedure?.trim() ?? '',
        count: entry.budget.items.length,
        total: computeBudget(entry.budget.items).totalUsd,
      })),
    [history],
  )

  const handleOpen = (id: string) => {
    const before = useBudgetStore.getState().budget
    const loaded = withUndo({ budget: before }, 'Presupuesto cargado del historial', () =>
      loadSavedBudget(id),
    )
    // Si la copia desapareció (por ejemplo, la borró otra pestaña), el aviso ya
    // salió y el diálogo se queda abierto.
    if (!loaded) return
    onBudgetReplaced()
    onOpenChange(false)
  }

  const handleRemove = (id: string) => {
    const before = useBudgetStore.getState().history
    withUndo({ history: before }, 'Copia eliminada del historial', () => {
      removeSavedBudget(id)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" onInteractOutside={keepOpenForToast}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            Historial
          </DialogTitle>
          <DialogDescription>
            Copias guardadas en este navegador (hasta {HISTORY_LIMIT}). No se suben a
            ningún servidor: si borras los datos del navegador, se van con ellos.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Todavía no has guardado ningún presupuesto. Usa «Guardar copia» en el panel
            de acciones y aparecerá aquí.
          </p>
        ) : (
          <ScrollArea className="max-h-[55vh] pr-2">
            <ul className="grid gap-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {entry.patient || 'Sin nombre'}
                      {entry.procedure ? (
                        <span className="font-normal text-muted-foreground">
                          {' · '}
                          {entry.procedure}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(entry.savedAt)} · {entry.count}{' '}
                      {entry.count === 1 ? 'servicio' : 'servicios'} ·{' '}
                      <span className="font-medium text-foreground">
                        {formatUsd(entry.total)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Abrir la copia de ${entry.patient || 'sin nombre'} del ${formatTimestamp(entry.savedAt)}`}
                      onClick={() => handleOpen(entry.id)}
                    >
                      <FolderOpen />
                      Abrir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Eliminar la copia de ${entry.patient || 'sin nombre'} del ${formatTimestamp(entry.savedAt)}`}
                      onClick={() => handleRemove(entry.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
