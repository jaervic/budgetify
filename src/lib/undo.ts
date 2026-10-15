import { toast } from 'sonner'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { Budget, Catalog } from '@/types'

/** Estado anterior que se puede restaurar (solo lo que cambia cada acción). */
export interface UndoSnapshot {
  budget?: Budget
  catalog?: Catalog
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
