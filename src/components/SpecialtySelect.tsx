import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Specialty } from '@/types'

/** Radix no admite valores vacíos: se usa un centinela para "sin área". */
const NONE = '__none__'

interface SpecialtySelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  specialties: Specialty[]
  /** Opción para quitar el área (los servicios sin área son transversales). */
  noneLabel?: string
  id?: string
  className?: string
  ariaLabel?: string
}

/** Selector de área de práctica (especialidad). */
export function SpecialtySelect({
  value,
  onChange,
  specialties,
  noneLabel = 'Todas las áreas',
  id,
  className,
  ariaLabel = 'Área de práctica',
}: SpecialtySelectProps) {
  const showNone = noneLabel !== ''
  return (
    <Select
      value={value && specialties.some((s) => s.id === value) ? value : NONE}
      onValueChange={(next) => onChange(next === NONE ? undefined : next)}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn('w-full', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {showNone && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
        {specialties.map((specialty) => (
          <SelectItem key={specialty.id} value={specialty.id}>
            {specialty.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
