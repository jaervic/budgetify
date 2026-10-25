import { useEffect, useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePdfActions } from '@/hooks/usePdfActions'
import { cn } from '@/lib/utils'

interface MobileActionBarProps {
  /** Abre el PDF (modal en escritorio, pestaña nueva en móvil). */
  onViewPdf: () => void
}

/** Campos de texto: si el usuario escribe, la barra no debe tapar el teclado ni el campo. */
const TEXT_FIELD =
  'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=file]):not([type=submit]), textarea'

/**
 * Barra de acción fija abajo, sólo en móvil/tablet, con las acciones principales.
 *
 * Tapaba los campos de precio que quedan en la franja inferior: al tocarlos se
 * pulsaba «Descargar PDF» en vez del campo. Por eso se oculta mientras se escribe
 * y al bajar por la página, y vuelve al subir o al detenerse arriba.
 */
export function MobileActionBar({ onViewPdf }: MobileActionBarProps) {
  const { busy, downloadPdf } = usePdfActions()
  const [scrolledDown, setScrolledDown] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - lastY) < 8) return
      setScrolledDown(y > lastY && y > 120)
      lastY = y
    }
    const onFocusIn = (event: FocusEvent) =>
      setTyping(event.target instanceof Element && event.target.matches(TEXT_FIELD))
    const onFocusOut = () => setTyping(false)

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const hidden = scrolledDown || typing

  return (
    <div
      data-mobile-action-bar
      aria-hidden={hidden || undefined}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 py-2 backdrop-blur transition-transform duration-150 lg:hidden',
        hidden && 'pointer-events-none translate-y-full',
      )}
    >
      <div className="mx-auto flex max-w-6xl gap-2">
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={busy || hidden}
          tabIndex={hidden ? -1 : undefined}
          onClick={() => void downloadPdf()}
        >
          <Download />
          Descargar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          tabIndex={hidden ? -1 : undefined}
          disabled={hidden}
          onClick={onViewPdf}
        >
          <Eye />
          Ver PDF
        </Button>
      </div>
    </div>
  )
}
