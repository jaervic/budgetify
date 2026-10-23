import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { NumberInput } from '@/components/NumberInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatRate } from '@/lib/money'
import { useBudgetStore } from '@/store/useBudgetStore'

function formatUpdate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Precio del dólar en bolívares. Se actualiza solo con el BCV o se fija a mano;
 * si hay red se consulta el BCV y, si no, se usa el último valor guardado.
 */
export function RateField() {
  const docMode = useBudgetStore((state) => state.docMode)
  const budgetRate = useBudgetStore((state) => state.budget.rate)
  const quoteRate = useBudgetStore((state) => state.quote.rate)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const bcv = useBudgetStore((state) => state.bcv)
  const setBudgetRate = useBudgetStore((state) => state.setRate)
  const setQuoteRate = useBudgetStore((state) => state.setQuoteRate)
  const setRateMode = useBudgetStore((state) => state.setRateMode)
  const refreshBcvRate = useBudgetStore((state) => state.refreshBcvRate)

  const isQuote = docMode === 'quote'
  const rate = isQuote ? quoteRate : budgetRate
  const setRate = isQuote ? setQuoteRate : setBudgetRate

  const isAuto = rateMode === 'auto'

  const handleAnchor = (checked: boolean) => {
    setRateMode(checked ? 'auto' : 'manual')
    // Desanclar es fácil de hacer sin querer y deja el presupuesto colgado de
    // una tasa que ya no se actualiza: conviene decirlo en el momento.
    if (!checked) {
      toast.info('Precio del dólar fijado a mano', {
        description:
          'Ya no se actualizará solo. Vuelve a marcar «Actualizar solo con el BCV» para que cambie automáticamente.',
      })
    }
  }

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="rate">Precio del dólar (Bs. por $1)</Label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={isAuto}
            onChange={(event) => handleAnchor(event.target.checked)}
          />
          Actualizar solo con el BCV
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NumberInput
          id="rate"
          className="max-w-40"
          aria-label="Precio del dólar en bolívares"
          decimals={4}
          value={rate}
          onValueChange={setRate}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={bcv.status === 'loading'}
          onClick={() => void refreshBcvRate()}
        >
          <RefreshCw className={bcv.status === 'loading' ? 'animate-spin' : undefined} />
          Actualizar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {bcv.status === 'loading' && 'Consultando el precio del dólar en el BCV…'}
        {bcv.status === 'ok' &&
          bcv.value !== null &&
          `BCV: Bs. ${formatRate(bcv.value)}${
            bcv.updatedAt ? ` · actualizado ${formatUpdate(bcv.updatedAt)}` : ''
          }${isAuto ? ' · se actualiza solo' : ' · fijado a mano'}`}
        {bcv.status === 'error' && (
          <span className="text-destructive">
            No se pudo consultar el BCV; se usa el precio que aparece arriba.
          </span>
        )}
        {bcv.status === 'idle' && 'Aún no se ha consultado el precio del BCV.'}
      </p>

      {rate <= 0 && (
        <p className="text-sm text-destructive">El precio debe ser mayor que 0.</p>
      )}
    </div>
  )
}
