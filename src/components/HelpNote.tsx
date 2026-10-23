import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpNoteProps {
  /** Pregunta corta que abre la explicación, p. ej. «¿Qué es el archivo?». */
  title: string
  children: ReactNode
  className?: string
}

/**
 * Explicación opcional que va plegada: solo se lee si el usuario la pide.
 * Usa `<details>`, así que es accesible con teclado y lectores de pantalla.
 */
export function HelpNote({ title, children, className }: HelpNoteProps) {
  return (
    <details className={cn('group text-sm text-muted-foreground', className)}>
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        {title}
      </summary>
      <div className="mt-1.5 grid gap-1.5 pl-5">{children}</div>
    </details>
  )
}
