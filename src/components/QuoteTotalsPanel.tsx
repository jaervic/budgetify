import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatRate } from '@/lib/money'
import type { QuoteCalcResult } from '@/lib/quoteCalc'
import {
  formatQuoteMoney,
  formatQuoteOtherTotal,
  quoteCurrencyLabel,
  quoteOtherTotalLabel,
} from '@/lib/quoteMoney'
import type { QuoteCurrency } from '@/types'

interface QuoteTotalsPanelProps {
  calc: QuoteCalcResult
  rate: number
  currency: QuoteCurrency
}

export function QuoteTotalsPanel({ calc, rate, currency }: QuoteTotalsPanelProps) {
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
              <span className="font-medium tabular-nums">
                {formatQuoteMoney(calc.subtotalUsd, currency, rate)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-medium tabular-nums">
                {formatQuoteMoney(calc.taxUsd, currency, rate)}
              </span>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid gap-1" aria-live="polite" aria-atomic="true">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold tracking-wide uppercase">Neto</span>
            <span
              className="text-xl font-bold tabular-nums"
              data-testid="quote-total"
            >
              {formatQuoteMoney(calc.totalUsd, currency, rate)}
            </span>
          </div>
          <span className="text-right text-sm font-medium tabular-nums text-primary">
            {quoteOtherTotalLabel(currency)}: {formatQuoteOtherTotal(calc.totalUsd, currency, rate)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {calc.items.length} {calc.items.length === 1 ? 'producto' : 'productos'} · Moneda:{' '}
          {quoteCurrencyLabel(currency)} · Tasa aplicada: Bs. {formatRate(rate)} por $1.
        </p>
      </CardContent>
    </Card>
  )
}
