import { RefreshCw } from 'lucide-react'
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
  const rate = useBudgetStore((state) => state.budget.rate)
  const rateMode = useBudgetStore((state) => state.rateMode)
  const bcv = useBudgetStore((state) => state.bcv)
  const setRate = useBudgetStore((state) => state.setRate)
  const setRateMode = useBudgetStore((state) => state.setRateMode)
  const refreshBcvRate = useBudgetStore((state) => state.refreshBcvRate)

  const isAuto = rateMode === 'auto'

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="rate">Tasa de cálculo (Bs. por $)</Label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={isAuto}
            onChange={(event) => setRateMode(event.target.checked ? 'auto' : 'manual')}
          />
          Anclar al BCV
        </label>
      </div>

      <div className="flex items-center gap-2">
        <NumberInput
          id="rate"
          className="max-w-40"
          aria-label="Tasa de cálculo"
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

      <p className="text-xs text-muted-foreground">
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
