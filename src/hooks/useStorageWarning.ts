import { useEffect } from 'react'
import { toast } from 'sonner'
import { STORAGE_ERROR_EVENT } from '@/store/storage'

const TOAST_ID = 'storage-error'

/**
 * Avisa cuando el navegador rechaza guardar el borrador (cuota llena o modo
 * privado). El aviso es persistente a propósito: mientras no se pueda guardar,
 * el trabajo en curso se pierde al cerrar la pestaña.
 */
export function useStorageWarning() {
  useEffect(() => {
    const handle = () => {
      toast.error('No se pudieron guardar los cambios', {
        id: TOAST_ID,
        description:
          'El almacenamiento del navegador está lleno, así que lo que escribas no se guardará. Exporta el documento (JSON), quita imágenes grandes de la empresa y sigue trabajando.',
        duration: Number.POSITIVE_INFINITY,
        action: { label: 'Entendido', onClick: () => toast.dismiss(TOAST_ID) },
      })
    }
    window.addEventListener(STORAGE_ERROR_EVENT, handle)
    return () => window.removeEventListener(STORAGE_ERROR_EVENT, handle)
  }, [])
}
