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
 * Tasa de cálculo VES/USD. Se puede anclar a la tasa oficial del BCV o fijar a
 * mano; si hay red se consulta el BCV, y si no, se usa el último valor cacheado.
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
      toast.info('Tasa fijada a mano', {
        description:
          'Ya no seguirá al BCV. Vuelve a marcar «Anclar al BCV» para que se actualice sola.',
      })
    }
  }

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="rate">Tasa de cálculo (Bs. por $)</Label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={isAuto}
            onChange={(event) => handleAnchor(event.target.checked)}
          />
          Anclar al BCV
        </label>
      </div>

      <div className="flex items-center gap-2">
        <NumberInput
          id="rate"
          className="max-w-40"
          aria-label="Tasa de cálculo"
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

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {bcv.status === 'loading' && 'Consultando la tasa BCV…'}
        {bcv.status === 'ok' &&
          bcv.value !== null &&
          `BCV: Bs. ${formatRate(bcv.value)}${
            bcv.updatedAt ? ` · actualizada ${formatUpdate(bcv.updatedAt)}` : ''
          }${isAuto ? ' · anclada' : ' · no aplicada'}`}
        {bcv.status === 'error' && (
          <span className="text-destructive">
            No se pudo obtener la tasa BCV; se usa la tasa mostrada arriba.
          </span>
        )}
        {bcv.status === 'idle' && 'Aún no se ha consultado la tasa del BCV.'}
      </p>

      {rate <= 0 && (
        <p className="text-xs text-destructive">La tasa debe ser mayor que 0.</p>
      )}
    </div>
  )
}
