import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LIMITS } from '@/lib/limits'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Alta, renombrado y reordenado de categorías. */
export function CategoriesPanel() {
  const categories = useBudgetStore((state) => state.catalog.categories)
  const services = useBudgetStore((state) => state.catalog.services)
  const addCategory = useBudgetStore((state) => state.addCategory)
  const renameCategory = useBudgetStore((state) => state.renameCategory)
  const removeCategory = useBudgetStore((state) => state.removeCategory)
  const moveCategory = useBudgetStore((state) => state.moveCategory)
  const [draft, setDraft] = useState('')
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)

  const pendingCount = pendingRemove
    ? services.filter((service) => service.category === pendingRemove).length
    : 0

  const add = () => {
    if (!draft.trim()) return
    addCategory(draft)
    setDraft('')
  }

  const confirmRemove = () => {
    if (!pendingRemove) return
    const before = useBudgetStore.getState().catalog
    withUndo({ catalog: before }, `Categoría «${pendingRemove}» eliminada`, () =>
      removeCategory(pendingRemove),
    )
    setPendingRemove(null)
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:flex sm:items-center">
        <Input
          className="h-11 sm:h-10"
          aria-label="Nueva categoría"
          placeholder="Nueva categoría (ej. Consulta)"
          maxLength={LIMITS.category}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add()
          }}
        />
        <Button
          type="button"
          size="sm"
          className="h-11 w-full sm:h-9 sm:w-auto"
          onClick={add}
        >
          <Plus />
          Añadir
        </Button>
      </div>

      <ScrollArea className="h-[46vh] pr-3">
        <div className="grid gap-2">
          {categories.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no hay categorías.
            </p>
          )}
          {categories.map((category, index) => (
            <CategoryRow
              key={category}
              category={category}
              canMoveUp={index > 0}
              canMoveDown={index < categories.length - 1}
              onRename={(value) => renameCategory(category, value)}
              onRemove={() => setPendingRemove(category)}
              onMove={(direction) => moveCategory(category, direction)}
            />
          ))}
        </div>
      </ScrollArea>

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(next) => {
          if (!next) setPendingRemove(null)
        }}
        title={`¿Eliminar la categoría «${pendingRemove ?? ''}»?`}
        description={
          <p>
            {pendingCount === 0
              ? 'No tiene servicios asociados. Se puede deshacer desde el aviso.'
              : `Se eliminarán también ${pendingCount} servicio(s) de esa categoría. Se puede deshacer desde el aviso.`}
          </p>
        }
        confirmLabel="Eliminar categoría"
        destructive
        onConfirm={confirmRemove}
      />
    </div>
  )
}

interface CategoryRowProps {
  category: string
  canMoveUp: boolean
  canMoveDown: boolean
  onRename: (value: string) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

function CategoryRow({
  category,
  canMoveUp,
  canMoveDown,
  onRename,
  onRemove,
  onMove,
}: CategoryRowProps) {
  const [value, setValue] = useState(category)

  const commit = () => {
    if (value.trim() && value !== category) onRename(value)
    else setValue(category)
  }

  return (
    <div className="grid gap-2 rounded-lg border p-2 transition-colors hover:border-primary/30 sm:flex sm:items-center">
      <Input
        className="h-11 sm:h-10"
        aria-label="Nombre de la categoría"
        value={value}
        maxLength={LIMITS.category}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      <div className="flex justify-end gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Subir categoría"
          className="size-10 sm:size-9"
          disabled={!canMoveUp}
          onClick={() => onMove(-1)}
        >
          <ChevronUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Bajar categoría"
          className="size-10 sm:size-9"
          disabled={!canMoveDown}
          onClick={() => onMove(1)}
        >
          <ChevronDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Eliminar categoría"
          className="size-10 text-destructive hover:text-destructive sm:size-9"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
