import { useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_NOTES } from '@/data/defaults'
import { LIMITS } from '@/lib/limits'
import { changedNoteIndexes, missingNotes, noteTitle } from '@/lib/notes'
import { withUndo } from '@/lib/undo'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Notas y recomendaciones que aparecen al pie del presupuesto y del PDF. */
export function NotesEditor() {
  const notes = useBudgetStore((state) => state.budget.notes)
  const defaults = useBudgetStore((state) => state.savedBudgetNotes ?? DEFAULT_NOTES)
  const hasOwnDefaults = useBudgetStore((state) => state.savedBudgetNotes !== null)
  const setNotes = useBudgetStore((state) => state.setNotes)
  const saveDefault = useBudgetStore((state) => state.saveBudgetNotesDefault)
  const resetDefault = useBudgetStore((state) => state.resetBudgetNotesDefault)
  const restoreNotes = useBudgetStore((state) => state.restoreBudgetNotes)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)

  const missing = useMemo(() => missingNotes(notes, defaults), [notes, defaults])
  const changed = useMemo(() => changedNoteIndexes(notes, defaults), [notes, defaults])
  const defaultName = hasOwnDefaults ? 'mis notas' : 'las notas de fábrica'

  const update = (index: number, value: string) => {
    setNotes(notes.map((note, i) => (i === index ? value : note)))
  }

  const remove = (index: number) => {
    withUndo({ budget: useBudgetStore.getState().budget }, 'Nota eliminada', () =>
      setNotes(notes.filter((_, i) => i !== index)),
    )
  }

  const restore = (mode: 'all' | 'missing' | { index: number }, message: string) => {
    const before = useBudgetStore.getState().budget
    withUndo({ budget: before }, message, () => restoreNotes(mode))
  }

  const handleSaveDefault = () => {
    saveDefault()
    toast.success('Estas notas se usarán en los presupuestos nuevos')
  }

  const handleResetDefault = () => {
    const previous = useBudgetStore.getState().savedBudgetNotes
    withUndo({ savedBudgetNotes: previous }, 'Vuelven las notas de fábrica', () =>
      resetDefault(),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas y recomendaciones</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {missing.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3">
            <p className="text-sm">
              Faltan {missing.length === 1 ? 'una nota' : `${missing.length} notas`}:{' '}
              {missing.map(noteTitle).join(', ')}.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => restore('missing', 'Notas vueltas a poner')}
            >
              <RotateCcw />
              Volver a ponerlas
            </Button>
          </div>
        )}

        {/*
          La clave es el índice a propósito: las notas son texto suelto sin
          identidad propia y, al escribir, la posición no cambia. Con una clave
          estable por contenido, cada pulsación cambiaría la clave del campo
          que se está editando y React lo remontaría, perdiendo el foco a mitad
          de palabra.
        */}
        {notes.map((note, index) => (
          <div key={index} className="grid gap-1">
            <div className="flex items-start gap-2">
              <Textarea
                value={note}
                rows={2}
                maxLength={LIMITS.note}
                aria-label={`Nota ${index + 1}`}
                onChange={(event) => update(index, event.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Eliminar nota ${index + 1}`}
                className="text-destructive hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
            {changed.has(index) && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto w-fit p-0"
                onClick={() => restore({ index }, `Nota ${index + 1} restaurada`)}
              >
                <RotateCcw />
                Restaurar texto original
              </Button>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setNotes([...notes, ''])}
          >
            <Plus />
            Añadir nota
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRestoreOpen(true)}>
            <RotateCcw />
            {hasOwnDefaults ? 'Volver a mis notas' : 'Volver a las notas de fábrica'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleSaveDefault}>
            <Save />
            Guardar como mis predeterminadas
          </Button>
          {hasOwnDefaults && (
            <Button type="button" variant="ghost" size="sm" onClick={handleResetDefault}>
              Usar las de fábrica como predeterminadas
            </Button>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmRestoreOpen}
        onOpenChange={setConfirmRestoreOpen}
        title={`¿Volver a ${defaultName}?`}
        description={
          <p>
            Se reemplazan las notas actuales. Si escribiste datos bancarios en una nota, se
            pierden; puedes deshacerlo desde el aviso.
          </p>
        }
        confirmLabel="Volver a las notas"
        destructive
        onConfirm={() => restore('all', 'Notas restauradas')}
      />
    </Card>
  )
}
