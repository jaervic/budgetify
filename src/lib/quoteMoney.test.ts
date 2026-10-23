import { describe, expect, it } from 'vitest'
import {
  formatQuoteMoney,
  formatQuoteOtherMoney,
  fromQuoteCurrency,
  quoteCurrencyLabel,
  quoteOtherCurrency,
  quoteOtherTotalLabel,
  toQuoteCurrency,
} from './quoteMoney'

const RATE = 876.8

describe('moneda de la cotización', () => {
  it('convierte de USD a bolívares y de vuelta', () => {
    const ves = toQuoteCurrency(10, 'VES', RATE)
    expect(ves.toNumber()).toBeCloseTo(8768)
    expect(fromQuoteCurrency(ves, 'VES', RATE).toNumber()).toBeCloseTo(10)
  })

  it('deja los importes iguales cuando la moneda es USD', () => {
    expect(toQuoteCurrency(10, 'USD', RATE).toNumber()).toBe(10)
    expect(fromQuoteCurrency(10, 'USD', RATE).toNumber()).toBe(10)
  })

  it('formatea según la moneda elegida', () => {
    expect(formatQuoteMoney(10, 'USD', RATE)).toBe('$10.00')
    expect(formatQuoteMoney(10, 'VES', RATE)).toBe('Bs. 8.768,00')
  })

  it('muestra el total equivalente en la otra moneda', () => {
    expect(formatQuoteOtherMoney(10, 'USD', RATE)).toContain('Bs.')
    expect(formatQuoteOtherMoney(10, 'VES', RATE)).toBe('$10.00')
    expect(quoteOtherTotalLabel('USD')).toBe('Total en bolívares')
    expect(quoteOtherTotalLabel('VES')).toBe('Total en dólares')
    expect(quoteOtherCurrency('USD')).toBe('VES')
    expect(quoteOtherCurrency('VES')).toBe('USD')
    expect(quoteCurrencyLabel('USD')).toBe('USD')
    expect(quoteCurrencyLabel('VES')).toBe('Bs.')
  })
})
