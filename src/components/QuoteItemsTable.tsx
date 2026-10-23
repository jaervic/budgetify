import { useRef, type RefObject } from 'react'
import { QUOTE_ITEM_GRID, QuoteItemRow } from '@/components/QuoteItemRow'
import { quoteCurrencyLabel } from '@/lib/quoteMoney'
import type { QuoteCalcResult } from '@/lib/quoteCalc'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'

interface QuoteItemsTableProps {
  calc: QuoteCalcResult
  /** Botón al que devolver el foco si se elimina la última fila. */
  emptyFocusRef?: RefObject<HTMLButtonElement | null>
}

/** Tabla editable de productos de la cotización. */
export function QuoteItemsTable({ calc, emptyFocusRef }: QuoteItemsTableProps) {
  const updateQuoteItem = useBudgetStore((state) => state.updateQuoteItem)
  const removeQuoteItem = useBudgetStore((state) => state.removeQuoteItem)
  const duplicateQuoteItem = useBudgetStore((state) => state.duplicateQuoteItem)
  const moveQuoteItem = useBudgetStore((state) => state.moveQuoteItem)
  const currency = useBudgetStore((state) => state.quote.currency)
  const rate = useBudgetStore((state) => state.quote.rate)
  const showBothCurrencies = useBudgetStore((state) => state.quote.showBothCurrencies)
  const tableRef = useRef<HTMLDivElement>(null)

  const removeWithUndo = (id: string, description: string) => {
    const before = useBudgetStore.getState().quote
    withUndo({ quote: before }, `«${description || 'Producto'}» eliminado`, () => {
      removeQuoteItem(id)
      // El botón que tenía el foco desaparece con la fila. Se devuelve el foco
      // a la tabla, o al botón de agregar si la tabla se queda vacía.
      const target =
        calc.items.length <= 1 && emptyFocusRef ? emptyFocusRef.current : tableRef.current
      requestAnimationFrame(() => target?.focus())
    })
  }

  return (
    <div
      ref={tableRef}
      tabIndex={-1}
      role="table"
      aria-label="Productos de la cotización"
      className="@container rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div
        role="row"
        className={cn(
          'hidden border-b bg-muted/50 py-2 text-sm font-medium text-muted-foreground @min-[56rem]:grid',
          QUOTE_ITEM_GRID,
        )}
      >
        <span role="columnheader" className="px-1.5">Código</span>
        <span role="columnheader" className="px-1.5">Descripción</span>
        <span role="columnheader" className="px-1.5 text-right">Cant.</span>
        <span role="columnheader" className="px-1.5 text-center">Unidad</span>
        <span role="columnheader" className="px-1.5 text-right">
          {showBothCurrencies ? 'Precio' : `Precio ${quoteCurrencyLabel(currency)}`}
        </span>
        <span role="columnheader" className="px-1.5 text-right">% IVA</span>
        <span role="columnheader" className="px-1.5 text-right">IVA</span>
        <span role="columnheader" className="px-1.5 text-right">Neto</span>
        <span role="columnheader" className="px-1 text-right">Acciones</span>
      </div>

      {calc.items.map((item, index) => (
        <QuoteItemRow
          key={item.id}
          item={item}
          currency={currency}
          rate={rate}
          showBothCurrencies={showBothCurrencies}
          canMoveUp={index > 0}
          canMoveDown={index < calc.items.length - 1}
          onUpdate={(patch) => updateQuoteItem(item.id, patch)}
          onDuplicate={() => duplicateQuoteItem(item.id)}
          onRemove={() => removeWithUndo(item.id, item.description)}
          onMove={(direction) => moveQuoteItem(item.id, direction)}
        />
      ))}
    </div>
  )
}
