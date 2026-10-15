import { toast } from 'sonner'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { Budget, Catalog, SavedBudget } from '@/types'

/** Estado anterior que se puede restaurar (solo lo que cambia cada acción). */
export interface UndoSnapshot {
  budget?: Budget
  catalog?: Catalog
  history?: SavedBudget[]
}

/**
 * Un único aviso de "deshacer" a la vez: el más reciente. Si se borran dos
 * cosas seguidas, solo se ofrece deshacer la última, que es la que el usuario
 * tiene en mente. Con un id fijo, el aviso nuevo reemplaza al anterior.
 */
const TOAST_ID = 'undo'

/**
 * Ejecuta una acción que borra o reemplaza datos y ofrece deshacerla desde el
 * propio aviso. Devuelve lo que devuelva la acción.
 *
 * El estado del store es inmutable, así que basta con quedarse con la
 * referencia anterior a la mutación.
 */
export function withUndo<T>(snapshot: UndoSnapshot, message: string, action: () => T): T {
  const result = action()
  toast.success(message, {
    id: TOAST_ID,
    duration: 8000,
    action: {
      label: 'Deshacer',
      onClick: () => useBudgetStore.setState(snapshot),
    },
  })
  return result
}

/**
 * Evita que un diálogo modal se cierre cuando el clic cae en un aviso.
 *
 * Radix cierra el diálogo en cuanto detecta un clic fuera de él, y el aviso de
 * "deshacer" vive fuera (cuelga del `<body>`). Sin esto, deshacer un borrado
 * hecho desde dentro de un diálogo cerraba el diálogo de golpe: el dato volvía,
 * pero la lista desaparecía de la vista y había que volver a abrirla para
 * comprobarlo. Se pasa como `onInteractOutside`.
 */
export function keepOpenForToast(event: { target: EventTarget | null; preventDefault: () => void }): void {
  const target = event.target
  if (target instanceof Element && target.closest('[data-sonner-toaster]')) {
    event.preventDefault()
  }
}
