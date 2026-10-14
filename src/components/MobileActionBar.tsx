import { Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePdfActions } from '@/hooks/usePdfActions'
import type { CalcResult } from '@/lib/calc'

interface MobileActionBarProps {
  calc: CalcResult
  /** Abre el PDF (modal en escritorio, pestaña nueva en móvil). */
  onViewPdf: () => void
}

/** Barra de acción fija abajo, sólo en móvil/tablet, con las acciones principales. */
export function MobileActionBar({ calc, onViewPdf }: MobileActionBarProps) {
  const { busy, downloadPdf } = usePdfActions(calc)

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-6xl gap-2">
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={busy}
          onClick={() => void downloadPdf()}
        >
          <Download />
          Descargar PDF
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onViewPdf}>
          <Eye />
          Ver PDF
        </Button>
      </div>
    </div>
  )
}
