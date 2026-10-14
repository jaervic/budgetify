import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCalc } from '@/hooks/useCalc'
import { buildPdfBlob } from '@/pdf/actions'
import { useBudgetStore } from '@/store/useBudgetStore'

/**
 * Contenido del modal: se monta cada vez que se abre el diálogo, así que
 * genera el PDF una sola vez con el estado actual (sin refs ni resets).
 */
function PdfPreviewContent() {
  const calc = useCalc()
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    const {
      budget: currentBudget,
      clinic: currentClinic,
      rateMode,
      pageSize,
    } = useBudgetStore.getState()

    buildPdfBlob(currentBudget, calc, currentClinic, { rateMode, pageSize })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setUrl(objectUrl)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'No se pudo generar el PDF.')
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // Sólo al montar: el contenido se monta al abrir el diálogo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid h-[72vh] place-items-center overflow-hidden rounded-lg border bg-muted/30">
      {error ? (
        <p className="p-6 text-sm text-destructive">{error}</p>
      ) : url ? (
        <iframe src={url} title="Vista previa del PDF" className="h-full w-full" />
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Generando PDF…
        </p>
      )}
    </div>
  )
}

interface PdfPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Muestra el PDF real (el mismo que se descarga) dentro de un modal. */
export function PdfPreviewDialog({ open, onOpenChange }: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Vista previa del PDF</DialogTitle>
          <DialogDescription>
            Es exactamente el documento que se descarga o se imprime.
          </DialogDescription>
        </DialogHeader>
        {open && <PdfPreviewContent />}
      </DialogContent>
    </Dialog>
  )
}
