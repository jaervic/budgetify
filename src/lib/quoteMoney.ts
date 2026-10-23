import type { QuoteCurrency } from '@/types'
import { Decimal, formatUsd, formatVes, usdToVes } from './money'

/** Etiqueta corta de la moneda para encabezados y campos. */
export function quoteCurrencyLabel(currency: QuoteCurrency): string {
  return currency === 'VES' ? 'Bs.' : 'USD'
}

/** Importe en USD convertido a la moneda del documento. */
export function toQuoteCurrency(
  amountUsd: Decimal.Value,
  currency: QuoteCurrency,
  rate: number,
): Decimal {
  if (currency === 'VES' && rate > 0) return usdToVes(amountUsd, rate)
  return new Decimal(amountUsd)
}

/** Importe escrito en la moneda del documento, convertido de vuelta a USD. */
export function fromQuoteCurrency(
  amount: Decimal.Value,
  currency: QuoteCurrency,
  rate: number,
): Decimal {
  if (currency === 'VES' && rate > 0) return new Decimal(amount).div(rate)
  return new Decimal(amount)
}

/** Formatea un importe en USD según la moneda elegida para la cotización. */
export function formatQuoteMoney(
  amountUsd: Decimal.Value,
  currency: QuoteCurrency,
  rate: number,
): string {
  return currency === 'VES'
    ? formatVes(toQuoteCurrency(amountUsd, currency, rate))
    : formatUsd(amountUsd)
}

/** La moneda contraria a la principal. */
export function quoteOtherCurrency(currency: QuoteCurrency): QuoteCurrency {
  return currency === 'VES' ? 'USD' : 'VES'
}

/**
 * Importe equivalente en la otra moneda. Si la cotización es en USD, devuelve
 * el importe en bolívares; si es en VES, lo devuelve en dólares.
 */
export function formatQuoteOtherMoney(
  amountUsd: Decimal.Value,
  currency: QuoteCurrency,
  rate: number,
): string {
  return currency === 'VES'
    ? formatUsd(amountUsd)
    : formatVes(usdToVes(amountUsd, rate))
}

/** Etiqueta del total equivalente en la otra moneda. */
export function quoteOtherTotalLabel(currency: QuoteCurrency): string {
  return currency === 'VES' ? 'Total en dólares' : 'Total en bolívares'
}
