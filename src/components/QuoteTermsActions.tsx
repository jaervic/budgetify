import { useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Acciones de «Notas y condiciones»: volver al texto predeterminado o guardar el propio. */
export function QuoteTermsActions() {
  const savedQuoteTerms = useBudgetStore((state) => state.savedQuoteTerms)
  const saveDefault = useBudgetStore((state) => state.saveQuoteTermsDefault)
  const resetDefault = useBudgetStore((state) => state.resetQuoteTermsDefault)
  const restoreTerms = useBudgetStore((state) => state.restoreQuoteTerms)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hasOwnDefaults = savedQuoteTerms !== null

  const handleSaveDefault = () => {
    saveDefault()
    toast.success('Estas condiciones se usarán en las cotizaciones nuevas')
  }

  const handleResetDefault = () => {
    const previous = useBudgetStore.getState().savedQuoteTerms
    withUndo({ savedQuoteTerms: previous }, 'Vuelven las condiciones de fábrica', () =>
      resetDefault(),
    )
  }

  const handleRestore = () => {
    const before = useBudgetStore.getState().quote
    withUndo({ quote: before }, 'Condiciones restauradas', () => restoreTerms())
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
        <RotateCcw />
        {hasOwnDefaults ? 'Volver a mis condiciones' : 'Volver a las condiciones de fábrica'}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleSaveDefault}>
        <Save />
        Guardar como mis predeterminadas
      </Button>
      {hasOwnDefaults && (
        <Button type="button" variant="ghost" size="sm" onClick={handleResetDefault}>
          Usar las de fábrica como predeterminadas
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`¿Volver a ${hasOwnDefaults ? 'mis condiciones' : 'las condiciones de fábrica'}?`}
        description={
          <p>
            Se reemplaza el texto actual de las condiciones. Puedes deshacerlo desde el aviso.
          </p>
        }
        confirmLabel="Volver a las condiciones"
        destructive
        onConfirm={handleRestore}
      />
    </div>
  )
}
