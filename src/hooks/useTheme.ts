import { useEffect } from 'react'
import { applyTheme, resolveTheme, useThemeStore } from '@/store/useThemeStore'

/**
 * Gestiona el tema (claro/oscuro/sistema): lo aplica al `<html>`, lo persiste y
 * sigue los cambios del sistema mientras el modo es `system`.
 */
export function useTheme() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const toggle = useThemeStore((state) => state.toggle)

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system' || typeof window === 'undefined') return
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handle = () => applyTheme('system')
    query.addEventListener('change', handle)
    return () => query.removeEventListener('change', handle)
  }, [theme])

  return { theme, resolved: resolveTheme(theme), setTheme, toggle }
}
