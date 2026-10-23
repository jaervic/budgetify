import { useMemo, useRef, type RefObject } from 'react'
import { ITEM_GRID, ItemRow } from '@/components/ItemRow'
import type { CalcResult, ComputedItem } from '@/lib/calc'
import { Decimal, formatUsd, formatVes, usdToVes } from '@/lib/money'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'

interface ItemsTableProps {
  calc: CalcResult
  rate: number
  /** Botón al que devolver el foco si se elimina la última fila. */
  emptyFocusRef?: RefObject<HTMLButtonElement | null>
}

export function ItemsTable({ calc, rate, emptyFocusRef }: ItemsTableProps) {
  const updateItem = useBudgetStore((state) => state.updateItem)
  const updateFormula = useBudgetStore((state) => state.updateFormula)
  const removeItem = useBudgetStore((state) => state.removeItem)
  const duplicateItem = useBudgetStore((state) => state.duplicateItem)
  const moveItem = useBudgetStore((state) => state.moveItem)
  const catalogCategories = useBudgetStore((state) => state.catalog.categories)
  const tableRef = useRef<HTMLDivElement>(null)

  const concepts = useMemo(
    () => [...new Set(calc.items.map((item) => item.concept))],
    [calc.items],
  )
  const categories = useMemo(
    () => [...new Set(calc.items.map((item) => item.category))],
    [calc.items],
  )
  const categoryOptions = useMemo(
    () => [...new Set([...categories, ...catalogCategories])],
    [categories, catalogCategories],
  )

  const removeWithUndo = (item: ComputedItem) => {
    withUndo({ budget: useBudgetStore.getState().budget }, 'Servicio eliminado', () => {
      removeItem(item.id)
      // El botón que tenía el foco desaparece con la fila. Se devuelve el foco
      // a la tabla, o al botón de agregar si la tabla se queda vacía.
      const target =
        calc.items.length <= 1 && emptyFocusRef ? emptyFocusRef.current : tableRef.current
      requestAnimationFrame(() => target?.focus())
    })
  }

  // Agrupa por categoría respetando el orden de aparición.
  const groups = useMemo(() => {
    const map = new Map<string, ComputedItem[]>()
    for (const item of calc.items) {
      const list = map.get(item.category)
      if (list) list.push(item)
      else map.set(item.category, [item])
    }
    return [...map.entries()]
  }, [calc.items])

  return (
    // Semántica de tabla: sin ella, un lector de pantalla lee una lista plana
    // de ~150 controles sin decir a qué columna ni a qué servicio pertenecen.
    <div
      ref={tableRef}
      tabIndex={-1}
      role="table"
      aria-label="Servicios del presupuesto"
      className="rounded-lg border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* Cabecera: sólo en escritorio */}
      <div
        role="row"
        className={cn(
          'hidden border-b bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground sm:grid',
          ITEM_GRID,
        )}
      >
        <span role="columnheader" className="sm:px-2">
          Concepto / servicio
        </span>
        <span role="columnheader" className="sm:px-2">
          Cálculo
        </span>
        <span role="columnheader" className="text-right sm:px-2">
          USD
        </span>
        <span role="columnheader" className="text-right sm:px-2">
          VES
        </span>
        <span role="columnheader" className="text-right sm:px-1">
          Acciones
        </span>
      </div>

      {groups.flatMap(([category, items]) => {
        const label = category || 'Sin categoría'
        const subtotal =
          calc.subtotals.find((entry) => entry.category === category)?.amountUsd ??
          new Decimal(0)

        // Lista plana de filas (sin `rowgroup`): el rol `table` admite filas
        // directamente, y así las claves siguen siendo estables al reagrupar y
        // el foco no salta del campo que se está editando.
        return [
          <div
            key={`category-${category}`}
            role="row"
            className="bg-muted/60 px-3 py-1.5 font-semibold"
          >
            <span role="cell">{label}</span>
          </div>,

          // Cada fila se identifica por el id del ítem (estable), así el foco no
          // se pierde al reagrupar cambiando el nombre de la categoría.
          ...items.map((item, index) => (
            <ItemRow
              key={item.id}
              item={item}
              rate={rate}
              concepts={concepts}
              categories={categories}
              categoryOptions={categoryOptions}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onUpdate={(patch) => updateItem(item.id, patch)}
              onFormulaChange={(formula) => updateFormula(item.id, formula)}
              onDuplicate={() => duplicateItem(item.id)}
              onRemove={() => removeWithUndo(item)}
              onMove={(direction) => moveItem(item.id, direction)}
            />
          )),

          <div
            key={`subtotal-${category}`}
            role="row"
            className={cn(
              'grid gap-x-3 gap-y-0.5 bg-muted/30 px-3 py-2 sm:gap-0',
              ITEM_GRID,
            )}
          >
            <span
              role="cell"
              className="text-xs font-medium text-muted-foreground sm:col-span-2 sm:px-2 sm:py-1 sm:text-right"
            >
              Subtotal {label}
            </span>
            <span
              role="cell"
              aria-label="Subtotal en dólares"
              className="flex items-center justify-between gap-3 font-semibold tabular-nums sm:block sm:px-2 sm:py-1 sm:text-right"
            >
              <span className="text-xs font-normal text-muted-foreground sm:hidden">
                USD
              </span>
              <span className="whitespace-nowrap">{formatUsd(subtotal)}</span>
            </span>
            <span
              role="cell"
              aria-label="Subtotal en bolívares"
              className="flex items-center justify-between gap-3 font-semibold tabular-nums sm:block sm:px-2 sm:py-1 sm:text-right"
            >
              <span className="text-xs font-normal text-muted-foreground sm:hidden">
                VES
              </span>
              <span className="whitespace-nowrap">
                {formatVes(usdToVes(subtotal, rate))}
              </span>
            </span>
            <span role="cell" className="hidden sm:block" />
          </div>,
        ]
      })}
    </div>
  )
}
