import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { parseLocaleNumber } from '@/lib/number'
import { cn } from '@/lib/utils'

interface NumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number
  onValueChange: (value: number) => void
  /** Permite valores negativos (por defecto no). */
  allowNegative?: boolean
}

/**
 * Input numérico que deja escribir libremente (decimales, borrar...) y sólo
 * sincroniza el número hacia arriba cuando es válido. Evita el clásico salto a
 * 0 mientras se teclea "0." o "-".
 */
export function NumberInput({
  value,
  onValueChange,
  allowNegative = false,
  className,
  ...props
}: NumberInputProps) {
  const [text, setText] = useState(() => String(value))
  const [focused, setFocused] = useState(false)
  const [lastValue, setLastValue] = useState(value)

  // Si el valor cambia desde fuera y no estamos escribiendo, reflejarlo.
  // Es un ajuste de estado durante el render (patrón recomendado por React).
  if (value !== lastValue) {
    setLastValue(value)
    if (!focused) setText(String(value))
  }

  const handleChange = (raw: string) => {
    setText(raw)
    if (raw.trim() === '' || raw === '-' || raw === '.' || raw === ',') return
    const parsed = parseLocaleNumber(raw)
    if (Number.isNaN(parsed)) return
    if (!allowNegative && parsed < 0) return
    onValueChange(parsed)
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={cn('text-right tabular-nums', className)}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={(event) => {
        setFocused(true)
        props.onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        const parsed = parseLocaleNumber(text)
        const next = Number.isNaN(parsed) ? value : parsed
        setText(String(next))
        if (next !== value) onValueChange(next)
        props.onBlur?.(event)
      }}
    />
  )
}
