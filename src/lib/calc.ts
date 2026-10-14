import type { Item } from '@/types'
import { Decimal } from './money'

export interface ComputedItem extends Item {
  /** Monto calculado en USD (sin redondear; el redondeo es solo al mostrar). */
  amountUsd: Decimal
  /** Mensaje cuando la fórmula no se pudo resolver (referencia inexistente, ciclo...). */
  error?: string
}

export interface CategorySubtotal {
  category: string
  amountUsd: Decimal
}

export interface CalcResult {
  items: ComputedItem[]
  subtotals: CategorySubtotal[]
  totalUsd: Decimal
  errors: string[]
}

/**
 * Calcula los montos en USD de todos los ítems.
 *
 * Reglas:
 *  - `fixed` y `qty_unit` no dependen de nadie.
 *  - `percent_of_item` depende del ítem cuyo `concept` coincide con `refConcept`.
 *  - `percent_of_subtotal` depende del subtotal de su categoría, pero la base
 *    EXCLUYE los ítems que también son `percent_of_subtotal` de esa misma
 *    categoría. Así se evita la autorreferencia (p. ej. "Gastos de
 *    Administración" = % de "Gastos de Clínica" sin incluirse a sí mismo).
 *  - Se detectan dependencias circulares: el ítem problemático se reporta y su
 *    monto es 0 en vez de colgar la app.
 *
 * Es una función pura: no redondea, no usa floats para el dinero y nunca llama
 * a eval ni Function.
 */
export function computeBudget(items: Item[]): CalcResult {
  const total = items.length
  const amounts = new Array<Decimal>(total)
  const itemErrors = new Array<string | undefined>(total)
  // 0 = sin visitar, 1 = en curso, 2 = resuelto
  const state = new Array<0 | 1 | 2>(total).fill(0)
  const errors: string[] = []

  // Índice por concepto (el primero con ese nombre) para las fórmulas por %.
  const indexByConcept = new Map<string, number>()
  for (let i = 0; i < total; i++) {
    if (!indexByConcept.has(items[i].concept)) {
      indexByConcept.set(items[i].concept, i)
    }
  }

  const fail = (index: number, message: string): Decimal => {
    itemErrors[index] = message
    errors.push(message)
    return new Decimal(0)
  }

  const resolve = (index: number): Decimal => {
    if (state[index] === 2) return amounts[index]
    if (state[index] === 1) {
      return fail(index, `Dependencia circular detectada en "${items[index].concept}".`)
    }

    state[index] = 1
    const item = items[index]
    const formula = item.formula
    let value: Decimal

    if (formula.type === 'fixed') {
      value = new Decimal(formula.amountUsd)
    } else if (formula.type === 'qty_unit') {
      value = new Decimal(formula.qty).times(formula.unitUsd)
    } else if (formula.type === 'percent_of_item') {
      const refIndex = indexByConcept.get(formula.refConcept)
      if (refIndex === undefined || refIndex === index) {
        value = fail(
          index,
          `"${item.concept}" calcula sobre "${formula.refConcept}", que no existe en el presupuesto.`,
        )
      } else {
        value = resolve(refIndex).times(formula.percent).div(100)
      }
    } else {
      // percent_of_subtotal
      let base = new Decimal(0)
      for (let j = 0; j < total; j++) {
        const other = items[j]
        if (other.category !== formula.category) continue
        const otherFormula = other.formula
        const isSelfReferencingPercent =
          otherFormula.type === 'percent_of_subtotal' &&
          otherFormula.category === formula.category
        if (isSelfReferencingPercent) continue
        base = base.plus(resolve(j))
      }
      value = base.times(formula.percent).div(100)
    }

    state[index] = 2
    amounts[index] = value
    return value
  }

  for (let i = 0; i < total; i++) resolve(i)

  // Subtotales por categoría, respetando el orden de aparición.
  const subtotalByCategory = new Map<string, Decimal>()
  for (let i = 0; i < total; i++) {
    const category = items[i].category
    subtotalByCategory.set(
      category,
      (subtotalByCategory.get(category) ?? new Decimal(0)).plus(amounts[i]),
    )
  }

  let grandTotal = new Decimal(0)
  for (const value of subtotalByCategory.values()) grandTotal = grandTotal.plus(value)

  return {
    items: items.map((item, i) => ({
      ...item,
      amountUsd: amounts[i],
      error: itemErrors[i],
    })),
    subtotals: [...subtotalByCategory.entries()].map(([category, amountUsd]) => ({
      category,
      amountUsd,
    })),
    totalUsd: grandTotal,
    errors,
  }
}

/** Atajo: total general en USD de una lista de ítems. */
export function totalUsd(items: Item[]): Decimal {
  return computeBudget(items).totalUsd
}
