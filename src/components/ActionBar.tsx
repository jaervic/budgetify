import { useRef, useState } from 'react'
import {
  Download,
  Eraser,
  Eye,
  FileDown,
  FileUp,
  Printer,
  Save,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { usePdfActions } from '@/hooks/usePdfActions'
import type { CalcResult } from '@/lib/calc'
import { downloadJson, fileStamp, parseBudget, readJsonFile } from '@/lib/io'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { PageSize } from '@/types'

interface ActionBarProps {
  calc: CalcResult
  /** Se llama tras importar o limpiar, para remontar el formulario de datos. */
  onBudgetReplaced: () => void
  /** Abre el PDF (modal en escritorio, pestaña nueva en móvil). */
  onViewPdf: () => void
}

export function ActionBar({ calc, onBudgetReplaced, onViewPdf }: ActionBarProps) {
  const budget = useBudgetStore((state) => state.budget)
  const pageSize = useBudgetStore((state) => state.pageSize)
  const setPageSize = useBudgetStore((state) => state.setPageSize)
  const loadBudget = useBudgetStore((state) => state.loadBudget)
  const clearBudget = useBudgetStore((state) => state.clearBudget)
  const syncPricesToCatalog = useBudgetStore((state) => state.syncPricesToCatalog)
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const { busy, downloadPdf, printPdf, sharePdf } = usePdfActions(calc)

  const handleSync = () => {
    const count = syncPricesToCatalog()
    if (count === 0) {
      toast.info('No hay servicios del catálogo con precios editados.')
      return
    }
    toast.success(`Tarifas actualizadas en el catálogo (${count}).`)
  }

  const handleImport = async (file: File) => {
    try {
      const next = parseBudget(await readJsonFile(file))
      loadBudget(next)
      onBudgetReplaced()
      toast.success('Presupuesto importado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el presupuesto')
    }
  }

  const handleClear = () => {
    const before = useBudgetStore.getState().budget
    withUndo({ budget: before }, 'Presupuesto limpiado', () => {
      clearBudget()
      onBudgetReplaced()
    })
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <span className="text-xs font-medium text-muted-foreground">Tamaño de hoja</span>
        <Select value={pageSize} onValueChange={(value) => setPageSize(value as PageSize)}>
          <SelectTrigger aria-label="Tamaño de hoja">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Letter">Carta (Letter)</SelectItem>
            <SelectItem value="Legal">Oficio (Legal)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Button
          type="button"
          size="lg"
          disabled={busy}
          onClick={() => void downloadPdf()}
        >
          <Download />
          Descargar PDF
        </Button>
        <Button type="button" variant="outline" onClick={onViewPdf}>
          <Eye />
          Ver PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void printPdf()}
        >
          <Printer />
          Imprimir
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void sharePdf()}
        >
          <Share2 />
          WhatsApp
        </Button>
      </div>

      <Separator />

      <div className="grid gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleSync}>
          <Save />
          Guardar tarifas en el catálogo
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadJson(`presupuesto-${fileStamp()}.json`, budget)}
          >
            <FileDown />
            Exportar JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <FileUp />
            Importar JSON
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmClearOpen(true)}
        >
          <Eraser />
          Limpiar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="¿Limpiar el presupuesto?"
        description={
          <p>
            Se borran los servicios, los datos del paciente y las notas. Podrás
            deshacerlo desde el aviso que aparece al limpiarlo.
          </p>
        }
        confirmLabel="Limpiar presupuesto"
        destructive
        onConfirm={handleClear}
      />

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleImport(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
