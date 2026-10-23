import type { Clinic, PageSize, Quote, QuoteCurrency } from '@/types'
import type { QuoteCalcResult } from './quoteCalc'
import { formatShortDate } from './date'
import { Decimal, formatVes } from './money'
import {
  formatQuoteMoney,
  formatQuoteOtherMoney,
  quoteCurrencyLabel,
  quoteOtherCurrency,
  quoteOtherTotalLabel,
} from './quoteMoney'

export interface QuoteDocumentRow {
  id: string
  code: string
  description: string
  qty: string
  unit: string
  /** Precio unitario en la moneda de la cotización. */
  unitPrice: string
  unitPriceOther: string
  taxRate: string
  tax: string
  taxOther: string
  net: string
  netOther: string
}

/** Estructura común de la vista previa HTML y el PDF de cotización. */
export interface QuoteDocumentModel {
  clinic: Clinic
  number: string
  title: string
  currency: QuoteCurrency
  /** «USD», «VES» o «USD / VES» cuando se muestran ambas. */
  currencyDisplay: string
  showBothCurrencies: boolean
  issueDate: string
  dueDate?: string
  rateLabel: string
  client: Quote['client']
  seller?: string
  office?: string
  transport?: string
  purchaseOrder?: string
  description?: string
  /** Cabecera de la columna de precio, p. ej. «Precio USD» o «Precio Bs.». */
  priceColumnLabel: string
  rows: QuoteDocumentRow[]
  subtotal: string
  subtotalOther: string
  taxTotal: string
  taxTotalOther: string
  total: string
  totalOtherLabel: string
  totalOther: string
  pageSize: PageSize
  footerNote: string
}

const quantityFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 3,
})

const percentFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 2,
})

function optionalText(value: string | undefined): string | undefined {
  const clean = value?.trim()
  return clean || undefined
}

/**
 * Construye el modelo de la cotización con los importes ya formateados.
 * Compartirlo evita que la vista previa y el PDF se desincronicen.
 */
export function buildQuoteDocumentModel(
  quote: Quote,
  calc: QuoteCalcResult,
  clinic: Clinic,
  pageSize: PageSize,
): QuoteDocumentModel {
  const money = (amount: Decimal.Value) =>
    formatQuoteMoney(amount, quote.currency, quote.rate)
  const moneyOther = (amount: Decimal.Value) =>
    formatQuoteOtherMoney(amount, quote.currency, quote.rate)

  return {
    clinic,
    number: quote.number.trim() || '—',
    title: 'Cotización',
    currency: quote.currency,
    currencyDisplay: quote.showBothCurrencies
      ? `${quote.currency} / ${quoteOtherCurrency(quote.currency)}`
      : quote.currency,
    showBothCurrencies: quote.showBothCurrencies,
    issueDate: formatShortDate(quote.issueDate),
    dueDate: quote.dueDate ? formatShortDate(quote.dueDate) : undefined,
    rateLabel: `${formatVes(quote.rate)} por $1`,
    client: {
      ...quote.client,
      name: quote.client.name.trim() || '—',
      code: optionalText(quote.client.code),
      rif: optionalText(quote.client.rif),
      phones: optionalText(quote.client.phones),
      address: optionalText(quote.client.address),
    },
    seller: optionalText(quote.seller),
    office: optionalText(quote.office),
    transport: optionalText(quote.transport),
    purchaseOrder: optionalText(quote.purchaseOrder),
    description: optionalText(quote.description),
    priceColumnLabel: quote.showBothCurrencies
      ? 'Precio'
      : `Precio ${quoteCurrencyLabel(quote.currency)}`,
    rows: calc.items.map((item) => ({
      id: item.id,
      code: item.code.trim() || '—',
      description: item.description.trim() || '—',
      qty: quantityFormatter.format(item.qty),
      unit: item.unit.trim() || '—',
      unitPrice: money(item.unitPriceUsd),
      unitPriceOther: moneyOther(item.unitPriceUsd),
      taxRate: `${percentFormatter.format(item.taxRate)} %`,
      tax: money(item.taxUsd),
      taxOther: moneyOther(item.taxUsd),
      net: money(item.netUsd),
      netOther: moneyOther(item.netUsd),
    })),
    subtotal: money(calc.subtotalUsd),
    subtotalOther: moneyOther(calc.subtotalUsd),
    taxTotal: money(calc.taxUsd),
    taxTotalOther: moneyOther(calc.taxUsd),
    total: money(calc.totalUsd),
    totalOtherLabel: quoteOtherTotalLabel(quote.currency),
    totalOther: moneyOther(calc.totalUsd),
    pageSize,
    footerNote: 'Cotización de productos — documento generado con Budgetify',
  }
}
