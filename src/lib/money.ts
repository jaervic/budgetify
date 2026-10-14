import Decimal from 'decimal.js'

// Precisión holgada: la tasa puede traer 4+ decimales y no redondeamos
// hasta el momento de mostrar, así que necesitamos margen en los pasos.
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP })

export { Decimal }
export type DecimalValue = Decimal.Value

/** Envuelve cualquier valor numérico en un `Decimal`. */
export function toDecimal(value: Decimal.Value): Decimal {
  return new Decimal(value)
}

/** Convierte un monto en USD a VES aplicando la tasa. */
export function usdToVes(amountUsd: Decimal.Value, rate: Decimal.Value): Decimal {
  return new Decimal(amountUsd).times(rate)
}

const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const vesFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const rateFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

/**
 * Redondeo a 2 decimales SOLO para presentación. Internamente nunca redondeamos.
 */
function toDisplayNumber(value: Decimal.Value): number {
  return Number(new Decimal(value).toFixed(2))
}

/** Formatea USD con locale en-US, p. ej. `$350.00`. */
export function formatUsd(value: Decimal.Value): string {
  return `$${usdFormatter.format(toDisplayNumber(value))}`
}

/** Formatea VES como `Bs. 1.205.600,00` (locale es-VE). */
export function formatVes(value: Decimal.Value): string {
  return `Bs. ${vesFormatter.format(toDisplayNumber(value))}`
}

/** Formatea la tasa VES/USD mostrando hasta 4 decimales. */
export function formatRate(value: Decimal.Value): string {
  return rateFormatter.format(new Decimal(value).toNumber())
}
