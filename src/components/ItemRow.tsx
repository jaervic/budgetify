import { ChevronDown, ChevronUp, Copy, TriangleAlert, Trash2 } from 'lucide-react'
import { FormulaFields } from '@/components/FormulaFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ComputedItem } from '@/lib/calc'
import { formatUsd, formatVes, usdToVes } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Item } from '@/types'

/**
 * Columnas de la tabla de ítems a partir de `sm`. En móvil la fila se apila
 * como una tarjeta (una sola columna). Se exporta para reutilizarla en la
 * cabecera y en los subtotales de `ItemsTable`.
 */
export const ITEM_GRID =
  'sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_7rem_8rem_auto]'

interface ItemRowProps {
  item: ComputedItem
  rate: number
  concepts: string[]
  categories: string[]
  /** id del <datalist> compartido con las categorías sugeridas. */
  categoryListId: string
  canMoveUp: boolean
  canMoveDown: boolean
  onUpdate: (patch: Partial<Omit<Item, 'id'>>) => void
  onFormulaChange: (formula: Item['formula']) => void
  onDuplicate: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function ItemRow({
  item,
  rate,
  concepts,
  categories,
  categoryListId,
  canMoveUp,
  canMoveDown,
  onUpdate,
  onFormulaChange,
  onDuplicate,
  onRemove,
  onMove,
}: ItemRowProps) {
  return (
    <div
      className={cn(
        'grid gap-2 border-b border-border/60 px-3 py-3 last:border-b-0',
        'sm:items-start sm:gap-0 sm:px-0 sm:py-0',
        ITEM_GRID,
      )}
    >
      {/* Categoría, concepto y detalle */}
      <div className="grid gap-1 sm:px-2 sm:py-2">
        <Input
          className="h-8 text-xs text-muted-foreground"
          aria-label="Categoría"
          list={categoryListId}
          placeholder="Categoría"
          value={item.category}
          onChange={(event) => onUpdate({ category: event.target.value })}
        />
        <Input
          className="h-8 font-medium"
          aria-label="Concepto"
          value={item.concept}
          onChange={(event) => onUpdate({ concept: event.target.value })}
        />
        <Input
          className="h-8 text-xs text-muted-foreground"
          aria-label="Detalle"
          placeholder="Detalle (opcional)"
          value={item.detail ?? ''}
          onChange={(event) => onUpdate({ detail: event.target.value || undefined })}
        />
        {item.error && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <TriangleAlert className="size-3.5 shrink-0" />
            {item.error}
          </p>
        )}
      </div>

      {/* Fórmula */}
      <div className="sm:px-2 sm:py-2">
        <FormulaFields
          formula={item.formula}
          onChange={onFormulaChange}
          concepts={concepts}
          categories={categories}
        />
      </div>

      {/* Montos */}
      <div className="flex items-center justify-between gap-3 sm:block sm:px-2 sm:py-2 sm:text-right">
        <span className="text-xs text-muted-foreground sm:hidden">USD</span>
        <span className="font-medium tabular-nums whitespace-nowrap">
          {formatUsd(item.amountUsd)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block sm:px-2 sm:py-2 sm:text-right">
        <span className="text-xs text-muted-foreground sm:hidden">VES</span>
        <span className="tabular-nums whitespace-nowrap text-muted-foreground">
          {formatVes(usdToVes(item.amountUsd, rate))}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-0.5 sm:px-1 sm:py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Subir"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bajar"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
        >
          <ChevronDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Duplicar"
          onClick={onDuplicate}
        >
          <Copy />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Eliminar"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
