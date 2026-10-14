import { describe, expect, it } from 'vitest'
import { formatLongDate } from './date'

describe('formatLongDate', () => {
  it('formatea con mes capitalizado en español', () => {
    expect(formatLongDate('2026-10-13')).toBe('13 de Octubre de 2026')
    expect(formatLongDate('2026-01-01')).toBe('1 de Enero de 2026')
    expect(formatLongDate('2026-12-31')).toBe('31 de Diciembre de 2026')
  })

  it('no se desfasa por zona horaria', () => {
    // Un parseo con Date daría un día menos en zonas con offset negativo.
    expect(formatLongDate('2026-03-01')).toBe('1 de Marzo de 2026')
  })

  it('devuelve la entrada si no es una fecha válida', () => {
    expect(formatLongDate('')).toBe('')
    expect(formatLongDate('13/10/2026')).toBe('13/10/2026')
    expect(formatLongDate('2026-13-01')).toBe('2026-13-01')
  })
})
