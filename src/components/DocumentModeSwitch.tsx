import { FileText, ShoppingCart } from 'lucide-react'
import { useBudgetStore } from '@/store/useBudgetStore'
import { cn } from '@/lib/utils'
import type { DocMode } from '@/types'

const OPTIONS: Array<{ value: DocMode; label: string; icon: typeof FileText }> = [
  { value: 'budget', label: 'Presupuesto médico', icon: FileText },
  { value: 'quote', label: 'Cotización', icon: ShoppingCart },
]

/**
 * Selector entre las dos modalidades de documento.
 *
 * Es un grupo de botones con `aria-pressed`, no un tablist: no hay un panel
 * oculto por pestaña, sino un cambio de espacio de trabajo completo. Así el
 * lector de pantalla anuncia el estado de cada opción sin prometer una relación
 * tab/tabpanel que no existe.
 */
export function DocumentModeSwitch() {
  const docMode = useBudgetStore((state) => state.docMode)
  const setDocMode = useBudgetStore((state) => state.setDocMode)

  return (
    <div
      role="group"
      aria-label="Tipo de documento"
      className="inline-flex rounded-lg border bg-muted/50 p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const active = docMode === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setDocMode(option.value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline" aria-hidden="true">
              {option.label}
            </span>
            <span className="sm:hidden" aria-hidden="true">
              {option.value === 'budget' ? 'Presupuesto' : 'Cotización'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
