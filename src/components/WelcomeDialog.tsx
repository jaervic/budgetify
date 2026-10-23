import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBudgetStore } from '@/store/useBudgetStore'
import type { DocMode } from '@/types'

/** Clave local para no repetir la guía en cada visita. */
export const WELCOME_SEEN_KEY = 'budgetify:welcome-seen'

interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MODE_OPTIONS: Array<{
  value: DocMode
  title: string
  description: string
  icon: typeof FileText
}> = [
  {
    value: 'budget',
    title: 'Presupuesto médico',
    description: 'Para un paciente, con servicios y honorarios.',
    icon: FileText,
  },
  {
    value: 'quote',
    title: 'Cotización',
    description: 'Para un cliente, con productos y precios.',
    icon: ShoppingCart,
  },
]

/**
 * Guía de tres pasos para quien usa la app por primera vez.
 *
 * No rellena datos por el usuario: explica el recorrido y permite elegir el
 * tipo de documento en el primer paso. Se puede cerrar y reabrir con «¿Cómo se usa?».
 */
export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const docMode = useBudgetStore((state) => state.docMode)
  const setDocMode = useBudgetStore((state) => state.setDocMode)
  const [step, setStep] = useState(1)

  const finish = () => {
    setStep(1)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setStep(1)
        onOpenChange(next)
      }}
    >
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>Cómo hacer un documento en 3 pasos</DialogTitle>
          <DialogDescription>
            Puedes cerrarla y volver a abrirla con el botón «¿Cómo se usa?».
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
          Paso {step} de 3
        </p>

        {step === 1 && (
          <div className="grid gap-3">
            <p className="text-sm">
              Primero elige qué vas a crear. Puedes cambiar de tipo cuando quieras.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODE_OPTIONS.map((option) => {
                const Icon = option.icon
                const active = docMode === option.value
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 p-4 text-left whitespace-normal"
                    aria-pressed={active}
                    onClick={() => {
                      setDocMode(option.value)
                      setStep(2)
                    }}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.title}</span>
                      <span className="block text-sm font-normal text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <UserRound className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Llena los datos principales</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escribe el nombre del paciente o cliente y la fecha. Lo demás es
                  opcional y puedes completarlo después.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Si no sabes qué poner en un campo, déjalo vacío: no se imprime en el
              documento.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Agrega servicios o productos</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Usa «Agregar servicio» o «Agregar productos», ajusta cantidades y
                  precios, y revisa el total.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Download className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Descarga o envía el documento</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Con «Descargar PDF» lo guardas, con «Imprimir» lo sacas en papel y con
                  «WhatsApp» lo compartes.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1}
          >
            <ArrowLeft />
            Anterior
          </Button>
          {step < 3 ? (
            <Button type="button" onClick={() => setStep((current) => current + 1)}>
              Siguiente
              <ArrowRight />
            </Button>
          ) : (
            <Button type="button" onClick={finish}>
              <Check />
              Empezar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
