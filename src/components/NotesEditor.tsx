import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/lib/limits'
import { useBudgetStore } from '@/store/useBudgetStore'

/** Notas y recomendaciones que aparecen al pie del presupuesto y del PDF. */
export function NotesEditor() {
  const notes = useBudgetStore((state) => state.budget.notes)
  const setNotes = useBudgetStore((state) => state.setNotes)

  const update = (index: number, value: string) => {
    setNotes(notes.map((note, i) => (i === index ? value : note)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notas y recomendaciones</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
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
              onClick={() => setNotes(notes.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setNotes([...notes, ''])}
        >
          <Plus />
          Añadir nota
        </Button>
      </CardContent>
    </Card>
  )
}
