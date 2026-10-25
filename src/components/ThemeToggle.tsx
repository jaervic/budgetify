import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

/** Alterna entre tema claro y oscuro. */
export function ThemeToggle() {
  const { resolved, toggle } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-10 lg:size-9"
      aria-label="Cambiar entre modo claro y oscuro"
      onClick={toggle}
    >
      {resolved === 'dark' ? <Moon /> : <Sun />}
    </Button>
  )
}
