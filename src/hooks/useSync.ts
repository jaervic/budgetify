import { useEffect } from 'react'
import { initSync } from '@/lib/sync/engine'

/** Arranca la sincronización opcional una sola vez por pestaña. */
export function useSync(): void {
  useEffect(() => {
    initSync()
  }, [])
}
