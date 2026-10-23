import { useId } from 'react'
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react'
import { NumberInput } from '@/components/NumberInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ComputedQuoteItem } from '@/lib/quoteCalc'
import { LIMITS } from '@/lib/limits'
import {
  formatQuoteMoney,
  formatQuoteOtherMoney,
  fromQuoteCurrency,
  quoteCurrencyLabel,
  toQuoteCurrency,
} from '@/lib/quoteMoney'
import { cn } from '@/lib/utils'
import type { QuoteCurrency, QuoteItem } from '@/types'

/**
 * Columnas de la tabla de cotización a partir de `lg`. En pantallas menores la
 * fila se apila como una tarjeta, igual que la tabla del presupuesto médico.
 */
export const QUOTE_ITEM_GRID =
  'xl:grid-cols-[5.25rem_minmax(0,1.8fr)_4.25rem_4.25rem_5.75rem_4.25rem_5.25rem_5.75rem_auto]'

interface QuoteItemRowProps {
  item: ComputedQuoteItem
  currency: QuoteCurrency
  rate: number
  showBothCurrencies: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onUpdate: (patch: Partial<Omit<QuoteItem, 'id'>>) => void
  onDuplicate: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function QuoteItemRow({
  item,
  currency,
  rate,
  showBothCurrencies,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onDuplicate,
  onRemove,
  onMove,
}: QuoteItemRowProps) {
  const rowLabelId = useId()
  const label = item.description || 'producto sin descripción'

  return (
    <div
      role="row"
      aria-labelledby={rowLabelId}
      className={cn(
        'grid gap-2 border-b border-border/60 px-3 py-3 last:border-b-0',
        'xl:items-start xl:gap-0 xl:px-0 xl:py-0',
        QUOTE_ITEM_GRID,
      )}
    >
      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span id={rowLabelId} className="sr-only">
          {label}
        </span>
        <span className="text-xs text-muted-foreground xl:hidden">Código</span>
        <Input
          className="h-8"
          aria-label="Código"
          placeholder="Código"
          maxLength={LIMITS.productCode}
          value={item.code}
          onChange={(event) => onUpdate({ code: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span className="text-xs text-muted-foreground xl:hidden">Descripción</span>
        <Input
          className="h-8 font-medium"
          aria-label="Descripción"
          placeholder="Descripción del producto"
          maxLength={LIMITS.productDescription}
          value={item.description}
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span className="text-xs text-muted-foreground xl:hidden">Cantidad</span>
        <NumberInput
          className="h-8"
          aria-label="Cantidad"
          decimals={3}
          value={item.qty}
          onValueChange={(qty) => onUpdate({ qty })}
        />
      </div>

      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span className="text-xs text-muted-foreground xl:hidden">Unidad</span>
        <Input
          className="h-8 text-center"
          aria-label="Unidad"
          placeholder="UND"
          maxLength={LIMITS.productUnit}
          value={item.unit}
          onChange={(event) => onUpdate({ unit: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span className="text-xs text-muted-foreground xl:hidden">
          Precio {quoteCurrencyLabel(currency)}
        </span>
        <NumberInput
          className="h-8"
          aria-label={`Precio unitario en ${quoteCurrencyLabel(currency)}`}
          decimals={2}
          value={toQuoteCurrency(item.unitPriceUsd, currency, rate).toNumber()}
          onValueChange={(value) =>
            onUpdate({
              unitPriceUsd: fromQuoteCurrency(value, currency, rate).toNumber(),
            })
          }
        />
        {showBothCurrencies && (
          <span className="text-right text-xs tabular-nums text-muted-foreground">
            {formatQuoteOtherMoney(item.unitPriceUsd, currency, rate)}
          </span>
        )}
      </div>

      <div role="cell" className="grid gap-1 xl:px-2 xl:py-2">
        <span className="text-xs text-muted-foreground xl:hidden">% IVA</span>
        <NumberInput
          className="h-8"
          aria-label="Porcentaje de IVA"
          decimals={2}
          value={item.taxRate}
          onValueChange={(taxRate) => onUpdate({ taxRate: Math.min(100, taxRate) })}
        />
      </div>

      <div
        role="cell"
        aria-label={`IVA de ${label}`}
        className="flex items-center justify-between gap-3 xl:block xl:px-2 xl:py-2 xl:text-right"
      >
        <span className="text-xs text-muted-foreground xl:hidden">IVA</span>
        <span className="flex flex-col tabular-nums whitespace-nowrap xl:items-end">
          <span>{formatQuoteMoney(item.taxUsd, currency, rate)}</span>
          {showBothCurrencies && (
            <span className="text-xs text-muted-foreground">
              {formatQuoteOtherMoney(item.taxUsd, currency, rate)}
            </span>
          )}
        </span>
      </div>

      <div
        role="cell"
        aria-label={`Neto de ${label}`}
        className="flex items-center justify-between gap-3 font-medium xl:block xl:px-2 xl:py-2 xl:text-right"
      >
        <span className="text-xs font-normal text-muted-foreground xl:hidden">Neto</span>
        <span className="flex flex-col tabular-nums whitespace-nowrap xl:items-end">
          <span>{formatQuoteMoney(item.netUsd, currency, rate)}</span>
          {showBothCurrencies && (
            <span className="text-xs font-normal text-muted-foreground">
              {formatQuoteOtherMoney(item.netUsd, currency, rate)}
            </span>
          )}
        </span>
      </div>

      <div role="cell" className="flex items-center justify-end gap-0.5 xl:px-1 xl:py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Subir ${label}`}
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Bajar ${label}`}
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
        >
          <ChevronDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Duplicar ${label}`}
          onClick={onDuplicate}
        >
          <Copy />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Eliminar ${label}`}
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
