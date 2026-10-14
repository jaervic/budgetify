import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'budgetify:theme'
const LIGHT_THEME_COLOR = '#0284c7'
const DARK_THEME_COLOR = '#0b1220'

function readStoredTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  const value = localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

/** Tema efectivo (resuelve `system`). */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? (prefersDark() ? 'dark' : 'light') : theme
}

/** Aplica el tema al documento (clase `.dark`, color-scheme y theme-color). */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const isDark = resolveTheme(theme) === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR)
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
  toggle: () => {
    const next = resolveTheme(get().theme) === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))
