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

  it('interpreta "1.234" como miles (es-VE), no como decimal', () => {
    // Un error aquí multiplica el precio por mil: "1.500" no son 1,5 dólares.
    expect(parseLocaleNumber('1.234')).toBe(1234)
    expect(parseLocaleNumber('1.500')).toBe(1500)
    expect(parseLocaleNumber('12.345')).toBe(12345)
    expect(parseLocaleNumber('123.456')).toBe(123456)
  })

  it('no aplica la regla de miles cuando no es ambigua', () => {
    // Dos o cuatro decimales siguen siendo decimales.
    expect(parseLocaleNumber('876.80')).toBe(876.8)
    expect(parseLocaleNumber('879.1225')).toBe(879.1225)
    // Un cero delante es siempre decimal ("0.123", no "0123").
    expect(parseLocaleNumber('0.123')).toBe(0.123)
    // Cuatro dígitos delante no son una agrupación válida.
    expect(parseLocaleNumber('1234.567')).toBe(1234.567)
  })

  it('mantiene el signo al quitar el punto de miles', () => {
    expect(parseLocaleNumber('-1.234')).toBe(-1234)
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
