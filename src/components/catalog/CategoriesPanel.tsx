import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Alta, renombrado y reordenado de categorías. */
export function CategoriesPanel() {
  const categories = useBudgetStore((state) => state.catalog.categories)
  const addCategory = useBudgetStore((state) => state.addCategory)
  const renameCategory = useBudgetStore((state) => state.renameCategory)
  const removeCategory = useBudgetStore((state) => state.removeCategory)
  const moveCategory = useBudgetStore((state) => state.moveCategory)
  const [draft, setDraft] = useState('')

  const add = () => {
    if (!draft.trim()) return
    addCategory(draft)
    setDraft('')
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nueva categoría (ej. Consulta, Emergencia…)"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add()
          }}
        />
        <Button type="button" size="sm" onClick={add}>
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
              onRemove={() => removeCategory(category)}
              onMove={(direction) => moveCategory(category, direction)}
            />
          ))}
        </div>
      </ScrollArea>
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
    <div className="flex items-center gap-2 rounded-lg border p-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Subir categoría"
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
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
