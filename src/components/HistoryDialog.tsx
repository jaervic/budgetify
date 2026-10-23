import { useMemo } from 'react'
import { FolderOpen, History, Trash2 } from 'lucide-react'
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
import { computeBudget } from '@/lib/calc'
import { formatTimestamp } from '@/lib/date'
import { formatUsd } from '@/lib/money'
import { HISTORY_LIMIT } from '@/lib/limits'
import { computeQuote } from '@/lib/quoteCalc'
import { keepOpenForToast, withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { DocMode } from '@/types'

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Se llama al cargar una copia, para remontar los formularios. */
  onDocumentReplaced: () => void
}

/**
 * Historial de documentos guardados en este navegador (presupuestos y
 * cotizaciones). Cada entrada se guarda entera, así que abrir una copia
 * antigua restaura exactamente lo que se veía entonces. El nombre, el número
 * de líneas y el total se calculan aquí para no duplicar datos.
 */
export function HistoryDialog({
  open,
  onOpenChange,
  onDocumentReplaced,
}: HistoryDialogProps) {
  const history = useBudgetStore((state) => state.history)
  const loadSavedDocument = useBudgetStore((state) => state.loadSavedDocument)
  const removeSavedBudget = useBudgetStore((state) => state.removeSavedBudget)

  const entries = useMemo(
    () =>
      history.map((entry) => {
        if (entry.kind === 'quote') {
          return {
            id: entry.id,
            kind: entry.kind,
            savedAt: entry.savedAt,
            title: entry.quote.client.name.trim(),
            subtitle: entry.quote.number ? `N.º ${entry.quote.number}` : '',
            count: entry.quote.items.length,
            total: computeQuote(entry.quote.items).totalUsd,
          }
        }
        return {
          id: entry.id,
          kind: entry.kind,
          savedAt: entry.savedAt,
          title: entry.budget.patient.name.trim(),
          subtitle: entry.budget.procedure?.trim() ?? '',
          count: entry.budget.items.length,
          total: computeBudget(entry.budget.items).totalUsd,
        }
      }),
    [history],
  )

  const handleOpen = (id: string) => {
    const state = useBudgetStore.getState()
    const loaded = withUndo(
      {
        budget: state.budget,
        quote: state.quote,
        quoteCounter: state.quoteCounter,
        docMode: state.docMode,
      },
      'Documento cargado del historial',
      () => loadSavedDocument(id),
    )
    // Si la copia desapareció (por ejemplo, la borró otra pestaña), el aviso ya
    // salió y el diálogo se queda abierto.
    if (!loaded) return
    onDocumentReplaced()
    onOpenChange(false)
  }

  const handleRemove = (id: string) => {
    const before = useBudgetStore.getState().history
    withUndo({ history: before }, 'Copia eliminada del historial', () => {
      removeSavedBudget(id)
    })
  }

  const unitLabel = (kind: DocMode, count: number) => {
    if (kind === 'quote') return count === 1 ? 'producto' : 'productos'
    return count === 1 ? 'servicio' : 'servicios'
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
            Presupuestos y cotizaciones guardados en este navegador (hasta{' '}
            {HISTORY_LIMIT}). No se suben a ningún servidor: si borras los datos del
            navegador, se van con ellos.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            Todavía no has guardado ningún documento. Usa «Guardar copia» en el panel de
            acciones y aparecerá aquí.
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={entry.kind === 'quote' ? 'secondary' : 'outline'}>
                        {entry.kind === 'quote' ? 'Cotización' : 'Presupuesto'}
                      </Badge>
                      <p className="truncate font-medium">{entry.title || 'Sin nombre'}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.subtitle ? `${entry.subtitle} · ` : ''}
                      {formatTimestamp(entry.savedAt)} · {entry.count}{' '}
                      {unitLabel(entry.kind, entry.count)} ·{' '}
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
                      aria-label={`Abrir la copia de ${entry.title || 'sin nombre'} del ${formatTimestamp(entry.savedAt)}`}
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
                      aria-label={`Eliminar la copia de ${entry.title || 'sin nombre'} del ${formatTimestamp(entry.savedAt)}`}
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
