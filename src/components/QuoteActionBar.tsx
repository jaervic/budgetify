import { useRef, useState } from 'react'
import {
  BookmarkPlus,
  Download,
  Eye,
  FileDown,
  FilePlus2,
  FileUp,
  Printer,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { HelpNote } from '@/components/HelpNote'
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
import { downloadJson, fileStamp, parseDocument, readJsonFile } from '@/lib/io'
import { HISTORY_LIMIT } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { PageSize } from '@/types'

interface QuoteActionBarProps {
  /** Se llama tras importar o limpiar, para remontar los formularios. */
  onDocumentReplaced: () => void
  /** Abre el PDF (modal en escritorio, pestaña nueva en móvil). */
  onViewPdf: () => void
}

function slug(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'cliente'
  )
}

export function QuoteActionBar({ onDocumentReplaced, onViewPdf }: QuoteActionBarProps) {
  const quote = useBudgetStore((state) => state.quote)
  const quotePageSize = useBudgetStore((state) => state.quotePageSize)
  const setQuotePageSize = useBudgetStore((state) => state.setQuotePageSize)
  const loadBudget = useBudgetStore((state) => state.loadBudget)
  const loadQuote = useBudgetStore((state) => state.loadQuote)
  const clearQuote = useBudgetStore((state) => state.clearQuote)
  const saveToHistory = useBudgetStore((state) => state.saveToHistory)
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const { busy, downloadPdf, printPdf, sharePdf } = usePdfActions()

  const handleSaveCopy = () => {
    const { dropped } = saveToHistory()
    if (dropped > 0) {
      toast.success('Copia guardada en el historial', {
        description: `Se descartaron ${dropped} ${
          dropped === 1 ? 'copia antigua' : 'copias antiguas'
        } para no pasar de ${HISTORY_LIMIT}.`,
      })
      return
    }
    toast.success('Cotización guardada en el historial')
  }

  const handleImport = async (file: File) => {
    try {
      const parsed = parseDocument(await readJsonFile(file))
      if (parsed.kind === 'quote') {
        loadQuote(parsed.document)
        onDocumentReplaced()
        toast.success('Cotización importada')
        return
      }
      loadBudget(parsed.document)
      onDocumentReplaced()
      toast.success('Presupuesto importado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo importar el documento')
    }
  }

  const handleClear = () => {
    const state = useBudgetStore.getState()
    withUndo(
      { quote: state.quote, quoteCounter: state.quoteCounter },
      'Nueva cotización creada',
      () => {
        clearQuote()
        onDocumentReplaced()
      },
    )
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tamaño de hoja</span>
        <Select
          value={quotePageSize}
          onValueChange={(value) => setQuotePageSize(value as PageSize)}
        >
          <SelectTrigger aria-label="Tamaño de hoja de la cotización">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Letter">Carta (Letter)</SelectItem>
            <SelectItem value="A4">A4</SelectItem>
            <SelectItem value="Legal">Oficio (Legal)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Carta por defecto.
        </p>
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
        <Button type="button" variant="outline" size="sm" onClick={handleSaveCopy}>
          <BookmarkPlus />
          Guardar copia en el historial
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              downloadJson(
                `cotizacion-${slug(quote.client.name)}-${fileStamp()}.json`,
                quote,
              )
            }
          >
            <FileDown />
            Descargar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
          >
            <FileUp />
            Abrir
          </Button>
        </div>
        <HelpNote title="¿Qué es el archivo?">
          <p>Es una copia del documento para guardarla o abrirla en otro equipo.</p>
        </HelpNote>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmClearOpen(true)}
        >
          <FilePlus2 />
          Nueva cotización
        </Button>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="¿Empezar una nueva cotización?"
        description={
          <p>
            Se crea una cotización vacía con el siguiente número disponible. La actual se
            puede recuperar desde el aviso de deshacer.
          </p>
        }
        confirmLabel="Nueva cotización"
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
