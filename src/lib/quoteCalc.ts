import type { QuoteItem } from '@/types'
import { Decimal } from './money'

export interface ComputedQuoteItem extends QuoteItem {
  /** Base imponible de la línea, redondeada a 2 decimales. */
  baseUsd: Decimal
  /** IVA de la línea, redondeado a 2 decimales. */
  taxUsd: Decimal
  /** Base + IVA. */
  netUsd: Decimal
}

export interface QuoteCalcResult {
  items: ComputedQuoteItem[]
  subtotalUsd: Decimal
  taxUsd: Decimal
  totalUsd: Decimal
}

/**
 * Calcula una cotización de productos.
 *
 * A diferencia del presupuesto médico, aquí se redondea **por línea** a dos
 * decimales antes de sumar. Es lo que hace una factura impresa: el IVA que se
 * ve en cada renglón es el que se suma, de modo que Sub-Total + IVA = Neto
 * exactamente, sin diferencias de un céntimo.
 */
export function computeQuote(items: QuoteItem[]): QuoteCalcResult {
  const computed = items.map((item) => {
    const baseUsd = new Decimal(item.qty)
      .times(item.unitPriceUsd)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    const taxUsd = baseUsd
      .times(item.taxRate)
      .div(100)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

    return {
      ...item,
      baseUsd,
      taxUsd,
      netUsd: baseUsd.plus(taxUsd),
    }
  })

  let subtotalUsd = new Decimal(0)
  let taxUsd = new Decimal(0)
  for (const item of computed) {
    subtotalUsd = subtotalUsd.plus(item.baseUsd)
    taxUsd = taxUsd.plus(item.taxUsd)
  }

  return {
    items: computed,
    subtotalUsd,
    taxUsd,
    totalUsd: subtotalUsd.plus(taxUsd),
  }
}
