import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LIMITS } from '@/lib/limits'

/**
 * Centinelas para opciones que no son categorías reales. Radix no admite un
 * `SelectItem` con valor vacío, y la categoría de un ítem puede ser "".
 */
const NEW_CATEGORY = '\u0000nueva'
const NO_CATEGORY = '\u0000sin'

interface CategorySelectProps {
  value: string
  /** Categorías a ofrecer (normalmente las del catálogo más las ya en uso). */
  options: string[]
  onChange: (value: string) => void
  ariaLabel: string
  describedBy?: string
  className?: string
  placeholder?: string
  /** Ofrece «(Sin categoría)» para dejar el campo vacío. */
  allowEmpty?: boolean
}

/**
 * Selector de categoría con la lista siempre a la vista.
 *
 * Sustituye al `<input list>` + `<datalist>`: en Safari y en iOS la lista de
 * sugerencias no se despliega, así que en la práctica no había forma de saber
 * qué categorías existen. Con el selector la lista se abre en cualquier
 * dispositivo y «Nueva categoría…» permite crear una al vuelo.
 */
export function CategorySelect({
  value,
  options,
  onChange,
  ariaLabel,
  describedBy,
  className,
  placeholder = 'Elige una categoría',
  allowEmpty = false,
}: CategorySelectProps) {
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  const commit = () => {
    const next = draft.trim()
    setCreating(false)
    setDraft('')
    if (next && next !== value) onChange(next)
  }

  if (creating) {
    return (
      <Input
        ref={inputRef}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        maxLength={LIMITS.category}
        placeholder="Nueva categoría"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Escape') {
            setCreating(false)
            setDraft('')
          }
        }}
      />
    )
  }

  // La categoría en uso puede no estar en la lista (por ejemplo, una que se
  // borró del catálogo): se añade para no dejarla sin representar.
  const all = value && !options.includes(value) ? [value, ...options] : options

  return (
    <Select
      value={value === '' ? NO_CATEGORY : value}
      onValueChange={(next) => {
        if (next === NEW_CATEGORY) {
          setDraft('')
          setCreating(true)
          return
        }
        onChange(next === NO_CATEGORY ? '' : next)
      }}
    >
      <SelectTrigger
        className={`min-w-0 ${className ?? ''}`}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {all.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
        {allowEmpty && <SelectItem value={NO_CATEGORY}>(Sin categoría)</SelectItem>}
        <SelectItem value={NEW_CATEGORY}>
          <span className="flex items-center gap-1.5">
            <Plus className="size-3.5" />
            Nueva categoría…
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
