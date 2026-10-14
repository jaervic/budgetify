import { describe, expect, it } from 'vitest'
import { parseLocaleNumber } from './number'

describe('parseLocaleNumber', () => {
  it('acepta punto decimal', () => {
    expect(parseLocaleNumber('876.80')).toBe(876.8)
    expect(parseLocaleNumber('0.5')).toBe(0.5)
  })

  it('acepta coma decimal (es-VE)', () => {
    expect(parseLocaleNumber('876,80')).toBe(876.8)
    expect(parseLocaleNumber('1234,5')).toBe(1234.5)
  })

  it('acepta separador de miles y decimal combinados', () => {
    expect(parseLocaleNumber('1.234,56')).toBe(1234.56)
    expect(parseLocaleNumber('1,234.56')).toBe(1234.56)
  })

  it('trata varios puntos como separador de miles', () => {
    expect(parseLocaleNumber('1.234.567')).toBe(1234567)
  })

  it('ignora espacios', () => {
    expect(parseLocaleNumber(' 1.205.600,00 ')).toBe(1205600)
  })

  it('devuelve NaN con texto inválido', () => {
    expect(Number.isNaN(parseLocaleNumber(''))).toBe(true)
    expect(Number.isNaN(parseLocaleNumber('abc'))).toBe(true)
    expect(Number.isNaN(parseLocaleNumber('12abc'))).toBe(true)
    expect(Number.isNaN(parseLocaleNumber('$100'))).toBe(true)
  })

  it('acepta números directamente', () => {
    expect(parseLocaleNumber(42)).toBe(42)
  })
})
