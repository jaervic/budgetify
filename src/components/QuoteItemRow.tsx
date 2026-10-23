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
 * Columnas de la tabla de cotización. Dependen del ancho del contenedor (no de la
 * pantalla): con menos de 56rem la fila se apila como tarjeta.
 */
export const QUOTE_ITEM_GRID =
  '@min-[56rem]:grid-cols-[5rem_minmax(0,1fr)_4.25rem_4.25rem_5.75rem_4.25rem_5.25rem_5.75rem_10rem]'

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
        '@min-[56rem]:items-start @min-[56rem]:gap-0 @min-[56rem]:px-0 @min-[56rem]:py-0',
        QUOTE_ITEM_GRID,
      )}
    >
      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span id={rowLabelId} className="sr-only">
          {label}
        </span>
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">Código</span>
        <Input
          className="h-10"
          aria-label="Código"
          placeholder="Código"
          maxLength={LIMITS.productCode}
          value={item.code}
          onChange={(event) => onUpdate({ code: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">Descripción</span>
        <Input
          className="h-10 font-medium"
          aria-label="Descripción"
          placeholder="Descripción del producto"
          maxLength={LIMITS.productDescription}
          value={item.description}
          onChange={(event) => onUpdate({ description: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">Cantidad</span>
        <NumberInput
          className="h-10"
          aria-label="Cantidad"
          decimals={3}
          value={item.qty}
          onValueChange={(qty) => onUpdate({ qty })}
        />
      </div>

      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">Unidad</span>
        <Input
          className="h-10 text-center"
          aria-label="Unidad"
          placeholder="UND"
          maxLength={LIMITS.productUnit}
          value={item.unit}
          onChange={(event) => onUpdate({ unit: event.target.value })}
        />
      </div>

      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">
          Precio {quoteCurrencyLabel(currency)}
        </span>
        <NumberInput
          className="h-10"
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
          <span className="text-right text-sm tabular-nums text-muted-foreground">
            {formatQuoteOtherMoney(item.unitPriceUsd, currency, rate)}
          </span>
        )}
      </div>

      <div role="cell" className="grid gap-1 @min-[56rem]:px-1.5 @min-[56rem]:py-2">
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">% IVA</span>
        <NumberInput
          className="h-10"
          aria-label="Porcentaje de IVA"
          decimals={2}
          value={item.taxRate}
          onValueChange={(taxRate) => onUpdate({ taxRate: Math.min(100, taxRate) })}
        />
      </div>

      <div
        role="cell"
        aria-label={`IVA de ${label}`}
        className="flex items-center justify-between gap-3 @min-[56rem]:block @min-[56rem]:px-1.5 @min-[56rem]:py-2 @min-[56rem]:text-right"
      >
        <span className="text-sm text-muted-foreground @min-[56rem]:hidden">IVA</span>
        <span className="flex flex-col tabular-nums whitespace-nowrap @min-[56rem]:items-end">
          <span>{formatQuoteMoney(item.taxUsd, currency, rate)}</span>
          {showBothCurrencies && (
            <span className="text-sm text-muted-foreground">
              {formatQuoteOtherMoney(item.taxUsd, currency, rate)}
            </span>
          )}
        </span>
      </div>

      <div
        role="cell"
        aria-label={`Neto de ${label}`}
        className="flex items-center justify-between gap-3 font-medium @min-[56rem]:block @min-[56rem]:px-1.5 @min-[56rem]:py-2 @min-[56rem]:text-right"
      >
        <span className="text-sm font-normal text-muted-foreground @min-[56rem]:hidden">Neto</span>
        <span className="flex flex-col tabular-nums whitespace-nowrap @min-[56rem]:items-end">
          <span>{formatQuoteMoney(item.netUsd, currency, rate)}</span>
          {showBothCurrencies && (
            <span className="text-sm font-normal text-muted-foreground">
              {formatQuoteOtherMoney(item.netUsd, currency, rate)}
            </span>
          )}
        </span>
      </div>

      <div role="cell" className="flex items-center justify-end gap-0.5 @min-[56rem]:px-1 @min-[56rem]:py-1">
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
