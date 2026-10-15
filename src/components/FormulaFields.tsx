import { NumberInput } from '@/components/NumberInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Formula, FormulaType } from '@/types'

const TYPE_LABELS: Record<FormulaType, string> = {
  fixed: 'Precio fijo',
  qty_unit: 'Cantidad × unitario',
  percent_of_item: '% de otro servicio',
  percent_of_subtotal: '% de categoría',
}

const TYPES: FormulaType[] = ['fixed', 'qty_unit', 'percent_of_item', 'percent_of_subtotal']

interface FormulaFieldsProps {
  formula: Formula
  onChange: (formula: Formula) => void
  /** Conceptos a los que puede referirse un % de otro servicio. */
  concepts: string[]
  /** Categorías disponibles para un % de categoría. */
  categories: string[]
  /**
   * Id del texto con el que se describe la fila (su concepto). Se enlaza con
   * `aria-describedby` para que el lector de pantalla anuncie a qué servicio
   * pertenece cada importe: sin esto, en una tabla de trece filas no hay forma
   * de saber qué se está editando.
   */
  describedBy?: string
}

/** Editor compacto de la fórmula de precio de un ítem. */
export function FormulaFields({
  formula,
  onChange,
  concepts,
  categories,
  describedBy,
}: FormulaFieldsProps) {
  const changeType = (type: FormulaType) => {
    switch (type) {
      case 'fixed':
        onChange({ type: 'fixed', amountUsd: 0 })
        break
      case 'qty_unit':
        onChange({ type: 'qty_unit', qty: 1, unitUsd: 0 })
        break
      case 'percent_of_item':
        onChange({ type: 'percent_of_item', refConcept: concepts[0] ?? '', percent: 0 })
        break
      case 'percent_of_subtotal':
        onChange({ type: 'percent_of_subtotal', category: categories[0] ?? '', percent: 0 })
        break
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={formula.type} onValueChange={(value) => changeType(value as FormulaType)}>
        <SelectTrigger
          className="h-8 w-full sm:w-[168px]"
          aria-label="Tipo de precio"
          aria-describedby={describedBy}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {formula.type === 'fixed' && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span aria-hidden="true">$</span>
          <NumberInput
            className="h-8 w-24"
            aria-label="Monto en USD"
            aria-describedby={describedBy}
            decimals={2}
            value={formula.amountUsd}
            onValueChange={(amountUsd) => onChange({ ...formula, amountUsd })}
          />
        </div>
      )}

      {formula.type === 'qty_unit' && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <NumberInput
            className="h-8 w-16"
            aria-label="Cantidad"
            aria-describedby={describedBy}
            value={formula.qty}
            onValueChange={(qty) => onChange({ ...formula, qty })}
          />
          <span aria-hidden="true">×</span>
          <span aria-hidden="true">$</span>
          <NumberInput
            className="h-8 w-24"
            aria-label="Precio unitario en USD"
            aria-describedby={describedBy}
            decimals={2}
            value={formula.unitUsd}
            onValueChange={(unitUsd) => onChange({ ...formula, unitUsd })}
          />
        </div>
      )}

      {formula.type === 'percent_of_item' && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Select
            value={formula.refConcept}
            onValueChange={(refConcept) => onChange({ ...formula, refConcept })}
          >
            <SelectTrigger
              className="h-8 w-full sm:w-[168px]"
              aria-label="Servicio de referencia"
              aria-describedby={describedBy}
            >
              <SelectValue placeholder="Elige un servicio" />
            </SelectTrigger>
            <SelectContent>
              {concepts.map((concept) => (
                <SelectItem key={concept} value={concept}>
                  {concept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NumberInput
            className="h-8 w-16"
            aria-label="Porcentaje"
            aria-describedby={describedBy}
            value={formula.percent}
            onValueChange={(percent) => onChange({ ...formula, percent })}
          />
          <span aria-hidden="true">%</span>
        </div>
      )}

      {formula.type === 'percent_of_subtotal' && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Select
            value={formula.category}
            onValueChange={(category) => onChange({ ...formula, category })}
          >
            <SelectTrigger
              className="h-8 w-full sm:w-[168px]"
              aria-label="Categoría de referencia"
              aria-describedby={describedBy}
            >
              <SelectValue placeholder="Elige una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <NumberInput
            className="h-8 w-16"
            aria-label="Porcentaje"
            aria-describedby={describedBy}
            value={formula.percent}
            onValueChange={(percent) => onChange({ ...formula, percent })}
          />
          <span aria-hidden="true">%</span>
        </div>
      )}
    </div>
  )
}
