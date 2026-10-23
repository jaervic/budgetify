import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRate, formatUsd, formatVes, usdToVes } from '@/lib/money'
import type { QuoteCalcResult } from '@/lib/quoteCalc'

interface QuoteTotalsPanelProps {
  calc: QuoteCalcResult
  rate: number
}

export function QuoteTotalsPanel({ calc, rate }: QuoteTotalsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Totales de la cotización</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3" role="group" aria-label="Totales de la cotización">
        {calc.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay productos en la cotización.
          </p>
        ) : (
          <div className="grid gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">Sub-Total</span>
              <span className="font-medium tabular-nums">{formatUsd(calc.subtotalUsd)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-medium tabular-nums">{formatUsd(calc.taxUsd)}</span>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid gap-1" aria-live="polite" aria-atomic="true">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold tracking-wide uppercase">Neto</span>
            <span className="text-xl font-bold tabular-nums" data-testid="quote-total-usd">
              {formatUsd(calc.totalUsd)}
            </span>
          </div>
          <span className="text-right text-sm font-medium tabular-nums text-primary">
            {formatVes(usdToVes(calc.totalUsd, rate))}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {calc.items.length} {calc.items.length === 1 ? 'producto' : 'productos'} · Tasa
          aplicada: Bs. {formatRate(rate)} por $1. El monto en Bs. se recalcula con la tasa
          oficial del día de pago.
        </p>
      </CardContent>
    </Card>
  )
}
