import { formatUsd } from './money'
import type { Formula } from '@/types'

/** Descripción legible de una fórmula, para listados y ayudas de la UI. */
export function describeFormula(formula: Formula): string {
  switch (formula.type) {
    case 'fixed':
      return formatUsd(formula.amountUsd)
    case 'qty_unit':
      return `${formula.qty} × ${formatUsd(formula.unitUsd)}`
    case 'percent_of_item':
      return `${formula.percent}% de ${formula.refConcept || '—'}`
    case 'percent_of_subtotal':
      return `${formula.percent}% de ${formula.category || '—'}`
  }
}
