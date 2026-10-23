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

/** Los símbolos que acompañan a un campo; su nombre accesible ya lo dice. */
function Operator({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="text-sm text-muted-foreground">
      {children}
    </span>
  )
}

interface FormulaFieldsProps {
  formula: Formula
  onChange: (formula: Formula) => void
  /** Conceptos a los que puede referirse un % de otro servicio. */
  concepts: string[]
  /** Categorías disponibles para un % de categoría. */
  categories: string[]
  /**
   * Importe actual del ítem (USD). Al cambiar de tipo se usa para que el monto
   * no se pierda: pasar de "precio fijo 100" a "cantidad × unitario" deja
   * 1 × 100, no 1 × 0.
   */
  amountUsd?: number
  /**
   * Id del texto con el que se describe la fila (su concepto). Se enlaza con
   * `aria-describedby` para que el lector de pantalla anuncie a qué servicio
   * pertenece cada importe: sin esto, en una tabla de trece filas no hay forma
   * de saber qué se está editando.
   */
  describedBy?: string
}

/**
 * Editor compacto de la fórmula de precio de un ítem.
 *
 * Todos los controles cuelgan directamente del contenedor `flex-wrap` (los
 * `Select` de Radix no pintan nada propio, así que su disparador es un hijo
 * más). Envolverlos en un div intermedio rompía el cálculo del ancho: un
 * `w-full` dentro de un contenedor de ancho por contenido no tiene contra qué
 * resolverse y acababa desbordando la celda.
 */
export function FormulaFields({
  formula,
  onChange,
  concepts,
  categories,
  amountUsd = 0,
  describedBy,
}: FormulaFieldsProps) {
  const changeType = (type: FormulaType) => {
    switch (type) {
      case 'fixed':
        onChange({ type: 'fixed', amountUsd })
        break
      case 'qty_unit':
        onChange({ type: 'qty_unit', qty: 1, unitUsd: amountUsd })
        break
      // En los tipos porcentuales el importe depende de la referencia (otro
      // servicio o una categoría), así que no se puede conservar tal cual:
      // arrancan al 100 % de esa referencia y el usuario ajusta el porcentaje.
      case 'percent_of_item':
        onChange({ type: 'percent_of_item', refConcept: concepts[0] ?? '', percent: 100 })
        break
      case 'percent_of_subtotal':
        onChange({ type: 'percent_of_subtotal', category: categories[0] ?? '', percent: 100 })
        break
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={formula.type} onValueChange={(value) => changeType(value as FormulaType)}>
        <SelectTrigger
          className="h-10 w-full min-w-0"
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
        <>
          <Operator>$</Operator>
          <NumberInput
            className="h-10 w-24 min-w-0"
            aria-label="Monto en USD"
            aria-describedby={describedBy}
            decimals={2}
            value={formula.amountUsd}
            onValueChange={(amountUsd) => onChange({ ...formula, amountUsd })}
          />
        </>
      )}

      {formula.type === 'qty_unit' && (
        <>
          <NumberInput
            className="h-10 w-16 min-w-0"
            aria-label="Cantidad"
            aria-describedby={describedBy}
            value={formula.qty}
            onValueChange={(qty) => onChange({ ...formula, qty })}
          />
          <Operator>×</Operator>
          <Operator>$</Operator>
          <NumberInput
            className="h-10 w-24 min-w-0"
            aria-label="Precio unitario en USD"
            aria-describedby={describedBy}
            decimals={2}
            value={formula.unitUsd}
            onValueChange={(unitUsd) => onChange({ ...formula, unitUsd })}
          />
        </>
      )}

      {formula.type === 'percent_of_item' && (
        <>
          <Select
            value={formula.refConcept}
            onValueChange={(refConcept) => onChange({ ...formula, refConcept })}
          >
            <SelectTrigger
              className="h-10 w-full min-w-0"
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
            className="h-10 w-16 min-w-0"
            aria-label="Porcentaje"
            aria-describedby={describedBy}
            value={formula.percent}
            onValueChange={(percent) => onChange({ ...formula, percent })}
          />
          <Operator>%</Operator>
        </>
      )}

      {formula.type === 'percent_of_subtotal' && (
        <>
          <Select
            value={formula.category}
            onValueChange={(category) => onChange({ ...formula, category })}
          >
            <SelectTrigger
              className="h-10 w-full min-w-0"
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
            className="h-10 w-16 min-w-0"
            aria-label="Porcentaje"
            aria-describedby={describedBy}
            value={formula.percent}
            onValueChange={(percent) => onChange({ ...formula, percent })}
          />
          <Operator>%</Operator>
        </>
      )}
    </div>
  )
}
