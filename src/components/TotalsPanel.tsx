import { HelpNote } from '@/components/HelpNote'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CalcResult } from '@/lib/calc'
import { formatRate, formatUsd, formatVes, usdToVes } from '@/lib/money'

interface TotalsPanelProps {
  calc: CalcResult
  rate: number
}

export function TotalsPanel({ calc, rate }: TotalsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Totales</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {calc.subtotals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay servicios en el presupuesto.
          </p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {calc.subtotals.map((subtotal) => (
              <li key={subtotal.category} className="grid gap-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">{subtotal.category}</span>
                  <span className="font-medium tabular-nums">
                    {formatUsd(subtotal.amountUsd)}
                  </span>
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">
                  {formatVes(usdToVes(subtotal.amountUsd, rate))}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <div className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide">
              Total general
            </span>
            <span className="text-xl font-bold tabular-nums" data-testid="total-usd">
              {formatUsd(calc.totalUsd)}
            </span>
          </div>
          <span className="text-right text-sm font-medium tabular-nums text-primary">
            {formatVes(usdToVes(calc.totalUsd, rate))}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          Precio del dólar: Bs. {formatRate(rate)} por $1.
        </p>
        <HelpNote title="¿Por qué cambia el monto en Bs.?">
          <p>Se recalcula con el precio oficial del día de pago.</p>
        </HelpNote>
      </CardContent>
    </Card>
  )
}
